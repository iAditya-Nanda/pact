import json
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sse_starlette.sse import EventSourceResponse

from agent.api.schemas import (
    ChatRequest,
    ChatResponse,
    ApprovalRequestModel,
    RollbackRequest,
    RollbackResponse,
    PreferenceCreateRequest,
    PreferenceResponse,
    AlertResponse,
    AlertDismissResponse,
    HealthResponse,
)
from agent.api.dependencies import (
    get_orchestrator,
    get_db_manager,
    get_pref_repo,
    get_alerts_repo,
    get_scanner,
    get_audit_repo,
    get_tracer,
    get_metrics_collector,
    get_security_sanitizer,
)
from agent.api.events import event_broadcaster, sync_gen_to_async
from agent.core.orchestrator import AgentOrchestrator
from agent.db.connection import DatabaseManager
from agent.db.preferences_repo import PreferencesRepository
from agent.db.alerts_repo import AlertsRepository
from agent.db.audit_repo import AuditRepository
from agent.proactive.scanner import ProactiveScanner
from agent.models.preferences import UserPreference
from agent.telemetry.models import TraceTree, SystemMetrics
from agent.telemetry.tracer import Tracer
from agent.telemetry.metrics import MetricsCollector
from agent.security.sanitizer import SecuritySanitizer

router = APIRouter(prefix="/api", tags=["Agentic Workflow Gateway"])


@router.get("/health", response_model=HealthResponse)
def health_check(
    orch: AgentOrchestrator = Depends(get_orchestrator),
    manager: DatabaseManager = Depends(get_db_manager),
):
    """
    Health and readiness probe inspecting database connection, local LLM runtime, and active tools.
    """
    db_status = "connected" if manager.db_path.exists() else "uninitialized"
    active_tools = list(orch.registry._tools.keys())
    return HealthResponse(
        status="healthy",
        database=db_status,
        llm_engine="llama.cpp (qwen2.5:3b)",
        active_tools=active_tools,
    )


@router.post("/chat", response_model=ChatResponse)
def execute_chat(
    req: ChatRequest,
    orch: AgentOrchestrator = Depends(get_orchestrator),
):
    """
    Synchronous / Standard execution endpoint. Executes workflow to completion
    or suspends at Human-in-the-Loop policy gate.
    """
    try:
        result = orch.run(req.instruction, user_id=req.user_id, run_id=req.run_id)
        return ChatResponse(
            run_id=result.get("run_id", ""),
            status=result.get("status", "UNKNOWN"),
            raw_instruction=result.get("raw_instruction", req.instruction),
            intent=result.get("intent"),
            plan=result.get("plan"),
            pending_approval=result.get("pending_approval"),
            execution_history=result.get("execution_history", []),
            compensating_log=result.get("compensating_log", []),
            final_summary=result.get("final_summary"),
            error=result.get("error"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
def stream_chat(
    req: ChatRequest,
    orch: AgentOrchestrator = Depends(get_orchestrator),
):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint.
    Streams each discrete graph node transition (intent extraction, DAG plan, tool execution, approval cards).
    """
    sync_gen = orch.stream_run(req.instruction, user_id=req.user_id, run_id=req.run_id)
    return EventSourceResponse(sync_gen_to_async(sync_gen))


@router.post("/approve", response_model=ChatResponse)
def approve_action(
    req: ApprovalRequestModel,
    orch: AgentOrchestrator = Depends(get_orchestrator),
):
    """
    Human-in-the-Loop Clearance Gate. Resumes a paused workflow state
    after cryptographically verifying the payload hash.
    """
    try:
        result = orch.approve_and_resume(
            run_id=req.run_id,
            decision=req.decision,
            payload_hash=req.payload_hash,
        )
        return ChatResponse(
            run_id=result.get("run_id", req.run_id),
            status=result.get("status", "UNKNOWN"),
            raw_instruction=result.get("raw_instruction", ""),
            intent=result.get("intent"),
            plan=result.get("plan"),
            pending_approval=result.get("pending_approval"),
            execution_history=result.get("execution_history", []),
            compensating_log=result.get("compensating_log", []),
            final_summary=result.get("final_summary"),
            error=result.get("error"),
        )
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/approve/stream")
def stream_approve_action(
    req: ApprovalRequestModel,
    orch: AgentOrchestrator = Depends(get_orchestrator),
):
    """
    Streams resumption of an approved workflow step-by-step over SSE.
    """
    try:
        sync_gen = orch.stream_approve(
            run_id=req.run_id,
            decision=req.decision,
            payload_hash=req.payload_hash,
        )
        return EventSourceResponse(sync_gen_to_async(sync_gen))
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rollback", response_model=RollbackResponse)
def rollback_action(
    req: RollbackRequest,
    orch: AgentOrchestrator = Depends(get_orchestrator),
):
    """
    Time-Machine 1-Click Compensating Rollback.
    Reverses all executed mutating tool actions in reverse chronological order.
    """
    try:
        result = orch.revert_run(req.run_id)
        return RollbackResponse(
            run_id=result["run_id"],
            status=result["status"],
            reverted_count=result["reverted_count"],
            reverted_actions=result.get("reverted_actions", []),
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preferences", response_model=List[PreferenceResponse])
def list_preferences(
    user_id: str = Query("default_user"),
    repo: PreferencesRepository = Depends(get_pref_repo),
):
    """
    Lists active hard constraints and soft VIP preferences.
    """
    prefs = repo.list_active(user_id=user_id)
    return [
        PreferenceResponse(
            preference_id=p.preference_id,
            user_id=p.user_id,
            scope=p.scope.value if hasattr(p.scope, "value") else str(p.scope),
            rule_key=p.rule_key,
            description=p.description,
            constraint_type=p.constraint_type.value if hasattr(p.constraint_type, "value") else str(p.constraint_type),
            parameters=p.parameters,
            allowed_overrides=p.allowed_overrides,
            is_active=p.is_active,
        )
        for p in prefs
    ]


@router.post("/preferences", response_model=PreferenceResponse)
def create_preference(
    req: PreferenceCreateRequest,
    repo: PreferencesRepository = Depends(get_pref_repo),
):
    """
    Creates or registers a new user preference rule.
    """
    pref_id = f"pref_{uuid.uuid4().hex[:8]}"
    pref = UserPreference(
        preference_id=pref_id,
        user_id=req.user_id,
        scope=req.scope,
        rule_key=req.rule_key,
        description=req.description,
        constraint_type=req.constraint_type,
        parameters=req.parameters,
        allowed_overrides=req.allowed_overrides,
        is_active=req.is_active,
    )
    saved = repo.create_or_update(pref)
    return PreferenceResponse(
        preference_id=saved.preference_id,
        user_id=saved.user_id,
        scope=saved.scope.value if hasattr(saved.scope, "value") else str(saved.scope),
        rule_key=saved.rule_key,
        description=saved.description,
        constraint_type=saved.constraint_type.value if hasattr(saved.constraint_type, "value") else str(saved.constraint_type),
        parameters=saved.parameters,
        allowed_overrides=saved.allowed_overrides,
        is_active=saved.is_active,
    )


@router.delete("/preferences/{pref_id}")
def delete_preference(
    pref_id: str,
    repo: PreferencesRepository = Depends(get_pref_repo),
):
    """
    Deactivates or deletes an existing user preference rule.
    """
    success = repo.delete(pref_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Preference '{pref_id}' not found")
    return {"preference_id": pref_id, "status": "DELETED"}


@router.get("/alerts", response_model=List[AlertResponse])
def list_alerts(
    repo: AlertsRepository = Depends(get_alerts_repo),
):
    """
    Queries active proactive conflict, collision, and deadline alerts.
    """
    alerts = repo.list_unresolved()
    return [
        AlertResponse(
            alert_id=a.alert_id,
            alert_type=a.alert_type.value if hasattr(a.alert_type, "value") else str(a.alert_type),
            severity=a.severity.value if hasattr(a.severity, "value") else str(a.severity),
            title=a.title,
            description=a.description,
            detected_entities=a.detected_entities,
            proposed_resolution=a.proposed_resolution,
            proposed_action=a.proposed_action,
            status=a.status,
            created_at=a.created_at,
        )
        for a in alerts
    ]


@router.post("/alerts/{alert_id}/dismiss", response_model=AlertDismissResponse)
def dismiss_alert(
    alert_id: str,
    repo: AlertsRepository = Depends(get_alerts_repo),
):
    """
    Marks a proactive alert as acknowledged and dismissed.
    """
    success = repo.update_status(alert_id, "DISMISSED")
    if not success:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")
    return AlertDismissResponse(alert_id=alert_id, status="DISMISSED")


@router.post("/alerts/scan", response_model=List[AlertResponse])
async def trigger_proactive_scan(
    user_id: str = Query("default_user"),
    scanner: ProactiveScanner = Depends(get_scanner),
    repo: AlertsRepository = Depends(get_alerts_repo),
):
    """
    Forces an immediate proactive scan across calendar events and task deadlines.
    Persists detected alerts and broadcasts them to active SSE listeners.
    """
    detected = scanner.scan_all(user_id=user_id)
    saved_alerts = []
    for alert in detected:
        repo.create_alert(alert)
        saved_alerts.append(alert)
        await event_broadcaster.broadcast("proactive_alert", alert.model_dump(mode="json"))
    return [
        AlertResponse(
            alert_id=a.alert_id,
            alert_type=a.alert_type.value if hasattr(a.alert_type, "value") else str(a.alert_type),
            severity=a.severity.value if hasattr(a.severity, "value") else str(a.severity),
            title=a.title,
            description=a.description,
            detected_entities=a.detected_entities,
            proposed_resolution=a.proposed_resolution,
            proposed_action=a.proposed_action,
            status=a.status,
            created_at=a.created_at,
        )
        for a in saved_alerts
    ]


@router.get("/events")
async def sse_global_events():
    """
    Global Server-Sent Events stream for real-time proactive alerts and system notifications.
    """
    async def event_generator():
        q = await event_broadcaster.subscribe()
        try:
            yield {"event": "connected", "data": json.dumps({"status": "connected"})}
            while True:
                msg = await q.get()
                yield msg
        finally:
            await event_broadcaster.unsubscribe(q)

    return EventSourceResponse(event_generator())


@router.get("/telemetry/metrics", response_model=SystemMetrics)
def get_system_telemetry_metrics(
    collector: MetricsCollector = Depends(get_metrics_collector),
):
    """
    Computes real-time system performance, latency percentiles, tool usage, and security blocks.
    """
    return collector.get_system_metrics()


@router.get("/telemetry/traces")
def list_execution_traces(
    limit: int = Query(20, ge=1, le=100),
    tracer_svc: Tracer = Depends(get_tracer),
):
    """
    Lists recent execution traces with duration and error flags.
    """
    return tracer_svc.list_recent_traces(limit=limit)


@router.get("/telemetry/traces/{trace_id}", response_model=TraceTree)
def get_trace_tree(
    trace_id: str,
    tracer_svc: Tracer = Depends(get_tracer),
):
    """
    Retrieves full hierarchical execution span waterfall tree for a specific trace or run ID.
    """
    tree = tracer_svc.get_trace(trace_id)
    if not tree:
        raise HTTPException(status_code=404, detail=f"Trace '{trace_id}' not found")
    return tree


@router.get("/audit/runs/{run_id}")
def get_run_audit_trail(
    run_id: str,
    audit_svc: AuditRepository = Depends(get_audit_repo),
):
    """
    Retrieves complete chronological forensic audit trail of all actions executed during a run.
    """
    history = audit_svc.get_run_history(run_id)
    if not history:
        raise HTTPException(status_code=404, detail=f"No audit records found for run '{run_id}'")
    return history


@router.get("/security/events")
def list_security_events(
    limit: int = Query(50, ge=1, le=200),
    sanitizer_svc: SecuritySanitizer = Depends(get_security_sanitizer),
):
    """
    Queries recorded prompt injection attempts, jailbreaks, and clearance bypass violations.
    """
    return sanitizer_svc.list_security_events(limit=limit)

