import time
import uuid
from typing import Dict, Any, Callable, Optional, Tuple
from agent.db.connection import DatabaseManager, db_manager
from agent.db.audit_repo import AuditRepository
from agent.models.plan import RiskTier, StepStatus
from agent.models.tools import ToolExecutionResult, ToolExecutionStatus, VerificationResult
from agent.tools.mock_email import MockEmailAdapter
from agent.tools.mock_calendar import MockCalendarAdapter
from agent.tools.mock_tasks import MockTaskAdapter
from agent.telemetry.tracer import tracer
from agent.reliability.fault_injector import fault_injector


class ToolRegistry:
    def __init__(self, manager: DatabaseManager = db_manager):
        self.manager = manager
        self.audit_repo = AuditRepository(manager)
        self.email_adapter = MockEmailAdapter(manager)
        self.calendar_adapter = MockCalendarAdapter(manager)
        self.task_adapter = MockTaskAdapter(manager)

        # Mapping: tool_name -> (handler_fn, RiskTier, verifier_fn)
        self._tools: Dict[str, Tuple[Callable, RiskTier, Optional[Callable]]] = {}
        self._register_default_tools()

    def register_tool(
        self,
        name: str,
        handler: Callable,
        risk_tier: RiskTier,
        verifier: Optional[Callable] = None,
    ) -> None:
        self._tools[name] = (handler, risk_tier, verifier)

    def get_risk_tier(self, tool_name: str) -> RiskTier:
        if tool_name in self._tools:
            return self._tools[tool_name][1]
        return RiskTier.TIER_1_CONSEQUENTIAL  # Default safe: unknown tools require clearance

    def execute_tool(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        run_id: str,
        step_id: str,
        idempotency_key: str,
    ) -> ToolExecutionResult:
        """
        Executes a registered tool under full transactional governance:
        1. Idempotency Check (returns cached response if already executed)
        2. Audit Logging (starts execution record)
        3. Dispatch
        4. Post-Condition State Verification
        5. Audit Sealing
        """
        call_id = f"call_{uuid.uuid4().hex[:8]}"
        start_time = time.time()

        if tool_name not in self._tools:
            return ToolExecutionResult(
                call_id=call_id,
                tool_name=tool_name,
                status=ToolExecutionStatus.FAILED,
                error=f"Unrecognized tool '{tool_name}'",
                idempotency_key=idempotency_key,
            )

        handler, risk_tier, verifier = self._tools[tool_name]

        # 1. Idempotency Check: Prevent duplicate side effects
        if idempotency_key:
            cached_record = self.audit_repo.get_by_idempotency_key(idempotency_key)
            if cached_record and cached_record["status"] == StepStatus.SUCCESS.value:
                # Cache hit: return identical result without re-executing
                return ToolExecutionResult(
                    call_id=call_id,
                    tool_name=tool_name,
                    status=ToolExecutionStatus.VERIFIED,
                    data=cached_record["result"],
                    idempotency_key=idempotency_key,
                    verification=VerificationResult(
                        is_verified=True,
                        verification_details="Idempotency Cache Hit: Zero duplicate action executed",
                    ),
                    elapsed_ms=int((time.time() - start_time) * 1000),
                )

        # 2. Audit Log Start
        self.audit_repo.log_action_start(
            action_id=call_id,
            run_id=run_id,
            step_id=step_id,
            tool_name=tool_name,
            risk_tier=risk_tier,
            parameters=parameters,
            payload_hash="",
            idempotency_key=idempotency_key,
        )

        # 3. Dispatch to Tool Adapter
        try:
            with tracer.start_span(
                f"tool_execution:{tool_name}",
                trace_id=run_id,
                attributes={"tool_name": tool_name, "step_id": step_id, "idempotency_key": idempotency_key},
            ):
                fault_error = fault_injector.should_fail(tool_name)
                if fault_error:
                    raise RuntimeError(fault_error)

                raw_result = handler(**parameters)
                if isinstance(raw_result, list):
                    data_dict = [
                        item.model_dump() if hasattr(item, "model_dump") else item
                        for item in raw_result
                    ]
                elif hasattr(raw_result, "model_dump"):
                    data_dict = raw_result.model_dump()
                else:
                    data_dict = raw_result
        except Exception as e:
            elapsed = int((time.time() - start_time) * 1000)
            self.audit_repo.record_action_result(
                action_id=call_id,
                status=StepStatus.FAILED,
                error=str(e),
                is_verified=False,
            )
            return ToolExecutionResult(
                call_id=call_id,
                tool_name=tool_name,
                status=ToolExecutionStatus.FAILED,
                error=str(e),
                idempotency_key=idempotency_key,
                elapsed_ms=elapsed,
            )

        # 4. Post-Condition Verification
        verification = VerificationResult(is_verified=True, verification_details="Execution verified")
        if verifier:
            try:
                verification = verifier(parameters, data_dict)
            except Exception as e:
                verification = VerificationResult(
                    is_verified=False,
                    verification_details=f"Post-execution reconciliation failed: {e}",
                )

        elapsed = int((time.time() - start_time) * 1000)
        status = ToolExecutionStatus.VERIFIED if verification.is_verified else ToolExecutionStatus.RECONCILIATION_FAILED

        # 5. Record Audit Result
        self.audit_repo.record_action_result(
            action_id=call_id,
            status=StepStatus.SUCCESS if verification.is_verified else StepStatus.FAILED,
            result=data_dict,
            is_verified=verification.is_verified,
            verification_details=verification.verification_details,
        )

        return ToolExecutionResult(
            call_id=call_id,
            tool_name=tool_name,
            status=status,
            data=data_dict,
            idempotency_key=idempotency_key,
            verification=verification,
            elapsed_ms=elapsed,
        )

    def _register_default_tools(self) -> None:
        # Email Tools
        self.register_tool(
            "search_emails",
            self.email_adapter.search_inbox,
            RiskTier.TIER_0_SAFE,
        )
        self.register_tool(
            "read_email",
            self.email_adapter.read_email,
            RiskTier.TIER_0_SAFE,
        )
        self.register_tool(
            "draft_email",
            self.email_adapter.create_draft,
            RiskTier.TIER_0_SAFE,
        )
        self.register_tool(
            "send_email",
            self.email_adapter.send_email,
            RiskTier.TIER_1_CONSEQUENTIAL,
            verifier=self._verify_email_sent,
        )

        # Calendar Tools
        self.register_tool(
            "list_calendar_events",
            self.calendar_adapter.list_events,
            RiskTier.TIER_0_SAFE,
        )
        self.register_tool(
            "check_calendar_conflicts",
            self.calendar_adapter.check_conflicts,
            RiskTier.TIER_0_SAFE,
        )
        self.register_tool(
            "create_calendar_event",
            self.calendar_adapter.create_event,
            RiskTier.TIER_1_CONSEQUENTIAL,
            verifier=self._verify_event_created,
        )
        self.register_tool(
            "reschedule_calendar_event",
            self.calendar_adapter.reschedule_event,
            RiskTier.TIER_1_CONSEQUENTIAL,
            verifier=self._verify_event_rescheduled,
        )
        self.register_tool(
            "cancel_calendar_event",
            self.calendar_adapter.cancel_event,
            RiskTier.TIER_1_CONSEQUENTIAL,
            verifier=self._verify_event_cancelled,
        )

        # Task Tools
        self.register_tool(
            "list_tasks",
            self.task_adapter.list_tasks,
            RiskTier.TIER_0_SAFE,
        )
        self.register_tool(
            "create_task",
            self.task_adapter.create_task,
            RiskTier.TIER_0_SAFE,
        )
        self.register_tool(
            "complete_task",
            self.task_adapter.complete_task,
            RiskTier.TIER_1_CONSEQUENTIAL,
            verifier=self._verify_task_completed,
        )

    # --- Verification Handlers (Closed-Loop Post-Conditions) ---

    def _verify_email_sent(self, params: Dict[str, Any], result: Dict[str, Any]) -> VerificationResult:
        message_id = result.get("message_id")
        with self.manager.get_connection() as conn:
            row = conn.execute(
                "SELECT status FROM mock_emails WHERE email_id = ?",
                (message_id,),
            ).fetchone()
            if row and row["status"] == "SENT":
                return VerificationResult(
                    is_verified=True,
                    verified_resource_id=message_id,
                    verification_details="Email confirmed in database with status='SENT'",
                )
        return VerificationResult(is_verified=False, verification_details="Email record not found in SENT status")

    def _verify_event_created(self, params: Dict[str, Any], result: Dict[str, Any]) -> VerificationResult:
        event_id = result.get("event_id")
        with self.manager.get_connection() as conn:
            row = conn.execute(
                "SELECT status FROM mock_calendar_events WHERE event_id = ?",
                (event_id,),
            ).fetchone()
            if row and row["status"] == "CONFIRMED":
                return VerificationResult(
                    is_verified=True,
                    verified_resource_id=event_id,
                    verification_details="Calendar event confirmed created with status='CONFIRMED'",
                )
        return VerificationResult(is_verified=False, verification_details="Calendar event was not created")

    def _verify_event_rescheduled(self, params: Dict[str, Any], result: Dict[str, Any]) -> VerificationResult:
        event_id = result.get("event_id")
        expected_start = result.get("new_start")
        with self.manager.get_connection() as conn:
            row = conn.execute(
                "SELECT start_time FROM mock_calendar_events WHERE event_id = ?",
                (event_id,),
            ).fetchone()
            if row and row["start_time"] == expected_start:
                return VerificationResult(
                    is_verified=True,
                    verified_resource_id=event_id,
                    verification_details=f"Calendar event '{event_id}' confirmed updated to start_time='{expected_start}'",
                )
        return VerificationResult(is_verified=False, verification_details="Event start_time does not match expected update")

    def _verify_event_cancelled(self, params: Dict[str, Any], result: Dict[str, Any]) -> VerificationResult:
        event_id = result.get("event_id")
        with self.manager.get_connection() as conn:
            row = conn.execute(
                "SELECT status FROM mock_calendar_events WHERE event_id = ?",
                (event_id,),
            ).fetchone()
            if row and row["status"] == "CANCELLED":
                return VerificationResult(
                    is_verified=True,
                    verified_resource_id=event_id,
                    verification_details="Calendar event confirmed with status='CANCELLED'",
                )
        return VerificationResult(is_verified=False, verification_details="Event status is not CANCELLED")

    def _verify_task_completed(self, params: Dict[str, Any], result: Dict[str, Any]) -> VerificationResult:
        task_id = result.get("task_id")
        with self.manager.get_connection() as conn:
            row = conn.execute(
                "SELECT status FROM mock_tasks WHERE task_id = ?",
                (task_id,),
            ).fetchone()
            if row and row["status"] == "COMPLETED":
                return VerificationResult(
                    is_verified=True,
                    verified_resource_id=task_id,
                    verification_details="Task confirmed in database with status='COMPLETED'",
                )
        return VerificationResult(is_verified=False, verification_details="Task status is not COMPLETED")


tool_registry = ToolRegistry()
