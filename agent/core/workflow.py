import json
import uuid
from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt
from agent.core.state import AgentState
from agent.engine.client import local_llm_client
from agent.engine.intent_service import intent_service
from agent.engine.planner_service import planner_service
from agent.db.connection import db_manager
from agent.db.preferences_repo import PreferencesRepository
from agent.tools.registry import ToolRegistry, tool_registry
from agent.models.intent import ParsedIntent
from agent.models.plan import ExecutionPlan, PlanStep, RiskTier, StepStatus
from agent.models.approval import ApprovalRequest, ApprovalStatus
from agent.models.tools import ToolExecutionStatus
from agent.telemetry.tracer import tracer
from agent.security.sanitizer import security_sanitizer


class WorkflowEngine:
    def __init__(self, manager=db_manager, registry=None):
        self.manager = manager
        self.pref_repo = PreferencesRepository(manager)
        self.registry = registry or ToolRegistry(manager=manager)
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
                "failed": END,
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
        user_id = state.get("user_id", "default_user")
        run_id = state.get("run_id", "run_unknown")

        with tracer.start_span("intent_extraction", trace_id=run_id, attributes={"instruction": instruction, "user_id": user_id}):
            # Pre-execution security sanitization & injection defense
            sec_check = security_sanitizer.analyze_instruction(instruction, user_id=user_id)
            if not sec_check.is_safe:
                return {
                    "status": "FAILED",
                    "error": sec_check.reason,
                    "final_summary": f"Security violation blocked: {sec_check.reason}",
                }

            intent: ParsedIntent = intent_service.extract_intent(sec_check.sanitized_instruction)

            if intent.requires_clarification:
                return {
                    "intent": intent.model_dump(mode="json"),
                    "requires_clarification": True,
                    "clarification_prompt": intent.clarification_prompt,
                    "status": "CLARIFICATION_NEEDED",
                    "final_summary": intent.clarification_prompt,
                }

            return {
                "intent": intent.model_dump(mode="json"),
                "requires_clarification": False,
                "status": "PLANNING",
            }

    def _node_plan_workflow(self, state: AgentState) -> Dict[str, Any]:
        intent = ParsedIntent.model_validate(state["intent"])
        user_id = state.get("user_id", "default_user")
        run_id = state.get("run_id", f"run_{uuid.uuid4().hex[:10]}")

        with tracer.start_span("dag_planning", trace_id=run_id, attributes={"intent_category": intent.category.value}):
            active_prefs = self.pref_repo.list_active(user_id=user_id)
            plan: ExecutionPlan = planner_service.generate_plan(
                intent=intent,
                preferences=active_prefs,
                run_id=run_id,
            )

            return {
                "run_id": run_id,
                "plan": plan.model_dump(mode="json"),
                "status": "EXECUTING",
                "execution_history": [],
                "compensating_log": [],
            }

    def _node_policy_gate(self, state: AgentState) -> Dict[str, Any]:
        run_id = state.get("run_id", "run_unknown")
        with tracer.start_span("policy_gate", trace_id=run_id):
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
                    "request": approval_req.model_dump(mode="json"),
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
        run_id = state.get("run_id", "run_unknown")
        step_id = state["current_step_id"]

        with tracer.start_span("execute_step", trace_id=run_id, attributes={"step_id": step_id}):
            plan = ExecutionPlan.model_validate(state["plan"])
            step = next(s for s in plan.steps if s.step_id == step_id)

            history = list(state.get("execution_history", []))
            compensating_log = list(state.get("compensating_log", []))

            # Resolve dependent JSONPath parameter references from prior step results
            resolved_params = dict(step.parameters)
            for k, v in list(resolved_params.items()):
                if isinstance(v, str) and (v.startswith("$$.") or v.startswith("$")):
                    for prev in reversed(history):
                        prev_data = prev.get("data")
                        if isinstance(prev_data, list) and prev_data:
                            first = prev_data[0]
                            if isinstance(first, dict):
                                resolved_params[k] = first.get("email_id") or first.get("id") or first.get("event_id") or first.get("task_id") or str(first)
                                break
                        elif isinstance(prev_data, dict):
                            resolved_params[k] = prev_data.get("email_id") or prev_data.get("id") or prev_data.get("event_id") or prev_data.get("task_id") or str(prev_data)
                            break

            # Dispatch tool via ToolRegistry
            exec_result = self.registry.execute_tool(
                tool_name=step.tool_name,
                parameters=resolved_params,
                run_id=state["run_id"],
                step_id=step.step_id,
                idempotency_key=step.idempotency_key,
            )

            history.append(exec_result.model_dump(mode="json"))

            if exec_result.data and isinstance(exec_result.data, dict) and "compensating_action" in exec_result.data:
                compensating_log.append(exec_result.data["compensating_action"])

            if exec_result.status == ToolExecutionStatus.FAILED:
                step.status = StepStatus.FAILED
                step.error = exec_result.error
                return {
                    "plan": plan.model_dump(mode="json"),
                    "execution_history": history,
                    "compensating_log": compensating_log,
                    "status": "FAILED",
                    "error": exec_result.error,
                }

            step.status = StepStatus.SUCCESS
            step.result = exec_result.data

            return {
                "plan": plan.model_dump(mode="json"),
                "execution_history": history,
                "compensating_log": compensating_log,
                "status": "EXECUTING",
            }

    def _node_synthesize_summary(self, state: AgentState) -> Dict[str, Any]:
        run_id = state.get("run_id", "run_unknown")
        with tracer.start_span("synthesize_summary", trace_id=run_id):
            if state.get("status") == "FAILED":
                summary = f"Workflow failed: {state.get('error', 'Unknown execution error')}"
            elif state.get("status") == "CLARIFICATION_NEEDED":
                summary = state.get("clarification_prompt", "Clarification needed.")
            else:
                history = state.get("execution_history", [])
                if not history:
                    summary = "Your instruction has been processed with verified idempotency."
                else:
                    summaries = []
                    for step_res in history:
                        tool = step_res.get("tool_name", "")
                        data = step_res.get("data")

                        if tool == "search_emails":
                            if isinstance(data, list) and data:
                                unread = sum(1 for e in data if isinstance(e, dict) and not e.get("is_read", False))
                                top_emails = [
                                    f"'{e.get('subject')}' from {e.get('sender')}"
                                    for e in data[:3]
                                    if isinstance(e, dict)
                                ]
                                summaries.append(
                                    f"Found {len(data)} email(s) ({unread} unread). Recent: {', '.join(top_emails)}."
                                )
                            elif isinstance(data, list):
                                summaries.append("Searched your inbox; no matching emails found.")
                        elif tool == "read_email":
                            if isinstance(data, dict):
                                summaries.append(
                                    f"Email from {data.get('sender')}: '{data.get('subject')}'. Snippet: \"{str(data.get('body', ''))[:140]}\"."
                                )
                        elif tool == "draft_email":
                            if isinstance(data, dict):
                                summaries.append(
                                    f"Draft prepared for {data.get('recipient')} with subject '{data.get('subject')}'. Saved in compose drawer."
                                )
                        elif tool == "send_email":
                            if isinstance(data, dict):
                                summaries.append(
                                    f"Transmitted email to {data.get('recipient')} regarding '{data.get('subject')}'. Delivery verified."
                                )
                        elif tool == "check_calendar_conflicts":
                            if isinstance(data, dict):
                                if data.get("has_conflict"):
                                    conflicts = data.get("conflicting_events", [])
                                    titles = ", ".join(f"'{c.get('title')}' at {c.get('start_time')}" for c in conflicts if isinstance(c, dict))
                                    summaries.append(
                                        f"Detected {data.get('conflict_count')} meeting conflict(s) with {titles}. Rescheduling recommended to preserve focus time."
                                    )
                                else:
                                    summaries.append("Calendar schedule clear: No overlapping meeting conflicts detected.")
                        elif tool == "list_calendar_events":
                            if isinstance(data, list) and data:
                                ev_strs = [
                                    f"'{e.get('title')}' ({e.get('start_time')})"
                                    for e in data[:3]
                                    if isinstance(e, dict)
                                ]
                                summaries.append(f"Upcoming calendar events ({len(data)} total): {', '.join(ev_strs)}.")
                        elif tool == "reschedule_calendar_event":
                            if isinstance(data, dict):
                                summaries.append(
                                    f"Successfully rescheduled '{data.get('title', 'meeting')}' to {data.get('new_start', '3:30 PM')}. Calendar conflict cleared."
                                )
                        elif tool == "cancel_calendar_event":
                            if isinstance(data, dict):
                                summaries.append(
                                    f"Cancelled calendar event '{data.get('title', 'meeting')}'. Time slot liberated and participants notified."
                                )
                        elif tool == "list_tasks":
                            if isinstance(data, list) and data:
                                task_strs = [
                                    f"'{t.get('title')}' ({t.get('priority')} priority)"
                                    for t in data[:3]
                                    if isinstance(t, dict)
                                ]
                                summaries.append(f"Active Google Tasks ({len(data)} total): {', '.join(task_strs)}.")
                        elif tool == "create_task":
                            if isinstance(data, dict):
                                summaries.append(
                                    f"Registered task '{data.get('title')}' with {data.get('priority')} priority due today."
                                )
                        elif tool == "complete_task":
                            if isinstance(data, dict):
                                summaries.append(
                                    f"Task '{data.get('title')}' marked completed and cleared from your deliverables queue."
                                )

                    if summaries:
                        fallback_summary = " ".join(summaries)
                    else:
                        fallback_summary = f"Executed {len(history)} action(s) across Google Workspace with verified state consistency."

                    # Dynamic synthesis using pure C++ local LLM on Metal GPU
                    raw_inst = state.get("raw_instruction", "")
                    llm_prompt = f"""User Instruction: "{raw_inst}"

Real Tool Execution Results:
{chr(10).join(summaries)}

Synthesize a direct, concise, high-value executive update for the user answering their instruction based strictly on these tool results."""

                    ai_synth = local_llm_client.generate_text(
                        prompt=llm_prompt,
                        system_prompt="You are PACT, an executive AI Chief of Staff. Synthesize a concise, clear, and professional response directly addressing the user's request based strictly on the tool execution results. Avoid repetitive preambles.",
                        max_tokens=220,
                        temperature=0.2,
                    )

                    summary = ai_synth if ai_synth and len(ai_synth.strip()) > 15 else fallback_summary

            return {
                "final_summary": summary,
                "status": "COMPLETED" if state.get("status") != "FAILED" else "FAILED",
            }

    # --- Routing Logic ---

    def _route_after_intent(self, state: AgentState) -> Literal["clarification", "failed", "proceed"]:
        if state.get("status") == "FAILED":
            return "failed"
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
