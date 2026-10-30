import uuid
from typing import List, Optional, Dict, Any
from agent.engine.client import LocalLLMClient, local_llm_client
from agent.engine.prompts import DAG_PLANNER_SYSTEM_PROMPT
from agent.models.intent import ParsedIntent, IntentCategory, ActionType
from agent.models.plan import ExecutionPlan, PlanStep, RiskTier, StepStatus
from agent.models.preferences import UserPreference


class DAGPlanningService:
    def __init__(self, client: LocalLLMClient = local_llm_client):
        self.client = client

    def generate_plan(
        self,
        intent: ParsedIntent,
        preferences: Optional[List[UserPreference]] = None,
        run_id: Optional[str] = None,
    ) -> ExecutionPlan:
        """
        Synthesizes a dependency-aware ExecutionPlan DAG from a validated ParsedIntent.
        Computes deterministic idempotency keys for all planned steps.
        """
        active_run_id = run_id or f"run_{uuid.uuid4().hex[:12]}"
        pref_descriptions = [f"- {p.rule_key} ({p.constraint_type.value}): {p.description}" for p in (preferences or [])]
        prefs_text = "\n".join(pref_descriptions) if pref_descriptions else "No active preferences."

        prompt = f"""
Goal / Objective: "{intent.raw_instruction}"
Intent Category: {intent.category.value}
Intent Action: {intent.action.value}
Extracted Entities: {intent.entities}

Active User Preferences & Constraints:
{prefs_text}

Decompose this objective into an ordered DAG of PlanSteps using the available tools.
Make sure every mutating action (send_email, reschedule_calendar_event, cancel_calendar_event) is marked TIER_1_CONSEQUENTIAL.
Return the ExecutionPlan JSON with run_id="{active_run_id}" and plan_id="plan_{uuid.uuid4().hex[:8]}".
"""
        fallback_plan = self._deterministic_fallback_plan(intent, active_run_id)

        try:
            plan = self.client.generate_structured(
                prompt=prompt,
                system_prompt=DAG_PLANNER_SYSTEM_PROMPT,
                response_model=ExecutionPlan,
                model_name=self.client.config.tier_b_model,
                mock_fallback=fallback_plan,
            )
        except Exception:
            plan = ExecutionPlan.model_validate(fallback_plan)

        # Enforce run_id and compute deterministic idempotency keys on all steps
        plan.run_id = active_run_id
        for step in plan.steps:
            # Auto-enforce TIER_1_CONSEQUENTIAL for known mutating tools
            if step.tool_name in ["send_email", "reschedule_calendar_event", "cancel_calendar_event", "complete_task"]:
                step.risk_tier = RiskTier.TIER_1_CONSEQUENTIAL
            step.compute_idempotency_key(active_run_id)

        return plan

    def _deterministic_fallback_plan(self, intent: ParsedIntent, run_id: str) -> dict:
        """Deterministic plan generator matching intent patterns."""
        plan_id = f"plan_{uuid.uuid4().hex[:8]}"

        if intent.category == IntentCategory.CALENDAR and intent.action == ActionType.UPDATE:
            # Typical reschedule flow
            step1 = {
                "step_id": "step_1",
                "tool_name": "check_calendar_conflicts",
                "risk_tier": RiskTier.TIER_0_SAFE.value,
                "parameters": intent.entities,
                "dependencies": [],
                "idempotency_key": "",
                "status": StepStatus.PENDING.value,
            }
            step2 = {
                "step_id": "step_2",
                "tool_name": "reschedule_calendar_event",
                "risk_tier": RiskTier.TIER_1_CONSEQUENTIAL.value,
                "parameters": intent.entities,
                "dependencies": ["step_1"],
                "idempotency_key": "",
                "status": StepStatus.PENDING.value,
            }
            steps = [step1, step2]
        elif intent.category == IntentCategory.CROSS_APP:
            # Cross-app: email search -> task deadline check -> calendar hold -> draft reply
            step1 = {
                "step_id": "step_1",
                "tool_name": "search_emails",
                "risk_tier": RiskTier.TIER_0_SAFE.value,
                "parameters": {"query": intent.entities.get("topic", "review")},
                "dependencies": [],
                "idempotency_key": "",
                "status": StepStatus.PENDING.value,
            }
            step2 = {
                "step_id": "step_2",
                "tool_name": "list_tasks",
                "risk_tier": RiskTier.TIER_0_SAFE.value,
                "parameters": {"status": "PENDING"},
                "dependencies": [],
                "idempotency_key": "",
                "status": StepStatus.PENDING.value,
            }
            step3 = {
                "step_id": "step_3",
                "tool_name": "check_calendar_conflicts",
                "risk_tier": RiskTier.TIER_0_SAFE.value,
                "parameters": {"duration_minutes": 30},
                "dependencies": ["step_1", "step_2"],
                "idempotency_key": "",
                "status": StepStatus.PENDING.value,
            }
            step4 = {
                "step_id": "step_4",
                "tool_name": "send_email",
                "risk_tier": RiskTier.TIER_1_CONSEQUENTIAL.value,
                "parameters": {"recipient": intent.entities.get("sender", "sarah@acme.corp"), "action": "propose_time"},
                "dependencies": ["step_3"],
                "idempotency_key": "",
                "status": StepStatus.PENDING.value,
            }
            steps = [step1, step2, step3, step4]
        else:
            step1 = {
                "step_id": "step_1",
                "tool_name": "search_emails",
                "risk_tier": RiskTier.TIER_0_SAFE.value,
                "parameters": intent.entities,
                "dependencies": [],
                "idempotency_key": "",
                "status": StepStatus.PENDING.value,
            }
            steps = [step1]

        return {
            "plan_id": plan_id,
            "run_id": run_id,
            "objective": intent.raw_instruction or "Automated execution plan",
            "steps": steps,
            "current_step_index": 0,
            "is_completed": False,
        }


planner_service = DAGPlanningService()
