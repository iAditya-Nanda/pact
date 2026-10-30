import uuid
from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt
from agent.core.state import AgentState
from agent.engine.intent_service import intent_service
from agent.engine.planner_service import planner_service
from agent.db.connection import db_manager
from agent.db.preferences_repo import PreferencesRepository
from agent.tools.registry import tool_registry
from agent.models.intent import ParsedIntent
from agent.models.plan import ExecutionPlan, PlanStep, RiskTier, StepStatus
from agent.models.approval import ApprovalRequest, ApprovalStatus
from agent.models.tools import ToolExecutionStatus


class WorkflowEngine:
    def __init__(self, manager=db_manager):
        self.manager = manager
        self.pref_repo = PreferencesRepository(manager)
        self.graph = self._build_graph()

    def _build_graph(self):
        builder = StateGraph(AgentState)

        # Register nodes
        builder.add_node("parse_intent", self._node_parse_intent)
        builder.add_node("plan_workflow", self._node_plan_workflow)
        builder.add_node("policy_gate", self._node_policy_gate)
        builder.add_node("execute_step", self._node_execute_step)
        builder.add_node("synthesize_summary", self._node_synthesize_summary)

        # Edges
        builder.add_edge(START, "parse_intent")
        builder.add_conditional_edges(
            "parse_intent",
            self._route_after_intent,
            {
                "clarification": END,
                "proceed": "plan_workflow",
            },
        )
        builder.add_edge("plan_workflow", "policy_gate")
        builder.add_conditional_edges(
            "policy_gate",
            self._route_after_policy_gate,
            {
                "execute": "execute_step",
                "done": "synthesize_summary",
                "failed": "synthesize_summary",
            },
        )
        builder.add_conditional_edges(
            "execute_step",
            self._route_after_execute,
            {
                "loop_next": "policy_gate",
                "failed": "synthesize_summary",
                "done": "synthesize_summary",
            },
        )
        builder.add_edge("synthesize_summary", END)

        return builder

    # --- Node Handlers ---

    def _node_parse_intent(self, state: AgentState) -> Dict[str, Any]:
        instruction = state.get("raw_instruction", "")
        intent: ParsedIntent = intent_service.extract_intent(instruction)

        if intent.requires_clarification:
            return {
                "intent": intent.model_dump(),
                "requires_clarification": True,
                "clarification_prompt": intent.clarification_prompt,
                "status": "CLARIFICATION_NEEDED",
                "final_summary": intent.clarification_prompt,
            }

        return {
            "intent": intent.model_dump(),
            "requires_clarification": False,
            "status": "PLANNING",
        }

    def _node_plan_workflow(self, state: AgentState) -> Dict[str, Any]:
        intent = ParsedIntent.model_validate(state["intent"])
        user_id = state.get("user_id", "default_user")
        run_id = state.get("run_id", f"run_{uuid.uuid4().hex[:10]}")

        active_prefs = self.pref_repo.list_active(user_id=user_id)
        plan: ExecutionPlan = planner_service.generate_plan(
            intent=intent,
            preferences=active_prefs,
            run_id=run_id,
        )

        return {
            "run_id": run_id,
            "plan": plan.model_dump(),
            "status": "EXECUTING",
            "execution_history": [],
            "compensating_log": [],
        }

    def _node_policy_gate(self, state: AgentState) -> Dict[str, Any]:
        plan = ExecutionPlan.model_validate(state["plan"])
        ready_steps = plan.get_ready_steps()

        if not ready_steps:
            all_done = all(s.status in [StepStatus.SUCCESS, StepStatus.SKIPPED] for s in plan.steps)
            if all_done:
                return {"status": "COMPLETED"}
            return {"status": "FAILED", "error": "Deadlock: No ready steps available"}

        target_step = ready_steps[0]

        # Human-in-the-Loop Clearance Check
        if target_step.risk_tier == RiskTier.TIER_1_CONSEQUENTIAL:
            approval_req = ApprovalRequest(
                approval_id=f"appr_{uuid.uuid4().hex[:8]}",
                run_id=state["run_id"],
                step_id=target_step.step_id,
                tool_name=target_step.tool_name,
                summary=f"Requires clearance: Execute '{target_step.tool_name}'",
                payload=target_step.parameters,
                created_at="now",
            )
            sealed_hash = approval_req.seal_payload()

            # Native LangGraph interrupt halts execution and preserves state
            resume_data = interrupt({
                "action": "APPROVAL_REQUIRED",
                "request": approval_req.model_dump(),
                "payload_hash": sealed_hash,
            })

            decision = resume_data.get("decision") if isinstance(resume_data, dict) else resume_data
            if decision != ApprovalStatus.APPROVED.value and decision != "APPROVED":
                return {
                    "status": "FAILED",
                    "error": f"Action '{target_step.tool_name}' was rejected by user.",
                }

        return {
            "current_step_id": target_step.step_id,
            "status": "EXECUTING",
        }

    def _node_execute_step(self, state: AgentState) -> Dict[str, Any]:
        plan = ExecutionPlan.model_validate(state["plan"])
        step_id = state["current_step_id"]
        step = next(s for s in plan.steps if s.step_id == step_id)

        # Dispatch tool via ToolRegistry
        exec_result = tool_registry.execute_tool(
            tool_name=step.tool_name,
            parameters=step.parameters,
            run_id=state["run_id"],
            step_id=step.step_id,
            idempotency_key=step.idempotency_key,
        )

        history = list(state.get("execution_history", []))
        compensating_log = list(state.get("compensating_log", []))

        history.append(exec_result.model_dump())

        if exec_result.data and "compensating_action" in exec_result.data:
            compensating_log.append(exec_result.data["compensating_action"])

        if exec_result.status == ToolExecutionStatus.FAILED:
            step.status = StepStatus.FAILED
            step.error = exec_result.error
            return {
                "plan": plan.model_dump(),
                "execution_history": history,
                "compensating_log": compensating_log,
                "status": "FAILED",
                "error": exec_result.error,
            }

        step.status = StepStatus.SUCCESS
        step.result = exec_result.data

        return {
            "plan": plan.model_dump(),
            "execution_history": history,
            "compensating_log": compensating_log,
            "status": "EXECUTING",
        }

    def _node_synthesize_summary(self, state: AgentState) -> Dict[str, Any]:
        if state.get("status") == "FAILED":
            summary = f"Workflow failed: {state.get('error', 'Unknown execution error')}"
        elif state.get("status") == "CLARIFICATION_NEEDED":
            summary = state.get("clarification_prompt", "Clarification needed.")
        else:
            steps_done = len(state.get("execution_history", []))
            summary = (
                f"Successfully completed {steps_done} action(s) across systems. "
                f"All state mutations verified and logged."
            )

        return {
            "final_summary": summary,
            "status": "COMPLETED" if state.get("status") != "FAILED" else "FAILED",
        }

    # --- Routing Logic ---

    def _route_after_intent(self, state: AgentState) -> Literal["clarification", "proceed"]:
        if state.get("requires_clarification"):
            return "clarification"
        return "proceed"

    def _route_after_policy_gate(self, state: AgentState) -> Literal["execute", "done", "failed"]:
        if state.get("status") == "FAILED":
            return "failed"
        if state.get("status") == "COMPLETED":
            return "done"
        return "execute"

    def _route_after_execute(self, state: AgentState) -> Literal["loop_next", "failed", "done"]:
        if state.get("status") == "FAILED":
            return "failed"
        plan = ExecutionPlan.model_validate(state["plan"])
        ready = plan.get_ready_steps()
        if ready:
            return "loop_next"
        return "done"
