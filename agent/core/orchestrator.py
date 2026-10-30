import sqlite3
import uuid
from typing import Dict, Any, Optional
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Command
from agent.core.workflow import WorkflowEngine
from agent.core.state import AgentState
from agent.db.connection import db_manager
from agent.models.approval import ApprovalStatus
from agent.tools.registry import ToolRegistry, tool_registry


class AgentOrchestrator:
    def __init__(self, manager=db_manager, registry=None):
        self.manager = manager
        self.registry = registry or ToolRegistry(manager=manager)
        self.engine = WorkflowEngine(manager=manager, registry=self.registry)
        # Durable SQLite checkpointer pointing to the database directory
        self.conn = sqlite3.connect(str(manager.db_path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.checkpointer = SqliteSaver(self.conn)
        self.checkpointer.setup()
        self.app = self.engine.graph.compile(checkpointer=self.checkpointer)

    def run(self, instruction: str, user_id: str = "default_user", run_id: Optional[str] = None) -> AgentState:
        """
        Initiates a workflow run. Halts and returns state if Human-in-the-Loop clearance is needed.
        """
        active_run_id = run_id or f"run_{uuid.uuid4().hex[:10]}"
        config = {"configurable": {"thread_id": active_run_id}}

        initial_state: AgentState = {
            "run_id": active_run_id,
            "user_id": user_id,
            "raw_instruction": instruction,
            "execution_history": [],
            "compensating_log": [],
            "status": "INITIALIZED",
        }

        # Execute through the graph until terminal state or suspension
        result = self.app.invoke(initial_state, config=config)
        return self._normalize_result(result, active_run_id)

    def approve_and_resume(
        self,
        run_id: str,
        decision: ApprovalStatus = ApprovalStatus.APPROVED,
        payload_hash: Optional[str] = None,
    ) -> AgentState:
        """
        Resumes a paused workflow at SUSPENDED_APPROVAL using LangGraph Command(resume=...).
        Validates cryptographic payload hash before authorizing execution.
        """
        config = {"configurable": {"thread_id": run_id}}
        current_state = self.app.get_state(config)
        if not current_state or not current_state.values:
            raise ValueError(f"No checkpoint found for run_id '{run_id}'")

        # Extract interrupt metadata
        pending = None
        for task in current_state.tasks:
            if hasattr(task, "interrupts") and task.interrupts:
                interrupt_val = task.interrupts[0].value
                if isinstance(interrupt_val, dict) and "request" in interrupt_val:
                    pending = interrupt_val["request"]
                    break

        if not pending and current_state.values.get("pending_approval"):
            pending = current_state.values.get("pending_approval")

        if not pending:
            raise ValueError(f"Run '{run_id}' is not currently awaiting approval.")

        # Cryptographic Integrity Check
        if pending and payload_hash and pending.get("payload_hash") != payload_hash:
            raise PermissionError("Approval payload hash mismatch: The payload was altered after suspension!")

        # Resume the paused interrupt node via Command(resume=...)
        resume_command = Command(resume={"decision": decision.value, "payload_hash": payload_hash})
        result = self.app.invoke(resume_command, config=config)
        return self._normalize_result(result, run_id)

    def revert_run(self, run_id: str) -> Dict[str, Any]:
        """
        Executes 1-Click Compensating Rollback across all logged compensating actions in reverse order.
        """
        config = {"configurable": {"thread_id": run_id}}
        current_state = self.app.get_state(config)
        if not current_state or not current_state.values:
            raise ValueError(f"No state found for run_id '{run_id}'")

        compensating_log = current_state.values.get("compensating_log", [])
        reverted_actions = []

        # Execute in reverse chronological order
        for action in reversed(compensating_log):
            tool_name = action["tool_name"]
            params = action["parameters"]
            idempotency_key = f"revert_{run_id}_{uuid.uuid4().hex[:8]}"

            res = self.registry.execute_tool(
                tool_name=tool_name,
                parameters=params,
                run_id=f"revert_{run_id}",
                step_id="step_revert",
                idempotency_key=idempotency_key,
            )
            reverted_actions.append(res.model_dump(mode="json"))

        return {
            "run_id": run_id,
            "reverted_count": len(reverted_actions),
            "reverted_actions": reverted_actions,
            "status": "REVERTED",
        }

    def stream_run(self, instruction: str, user_id: str = "default_user", run_id: Optional[str] = None):
        """
        Streams workflow node updates step-by-step as structured event dicts.
        Yields events: run_started, intent_extracted, plan_generated, step_executed,
        summary_synthesized, approval_required, run_completed, run_failed, clarification_needed.
        """
        active_run_id = run_id or f"run_{uuid.uuid4().hex[:10]}"
        config = {"configurable": {"thread_id": active_run_id}}

        initial_state: AgentState = {
            "run_id": active_run_id,
            "user_id": user_id,
            "raw_instruction": instruction,
            "execution_history": [],
            "compensating_log": [],
            "status": "INITIALIZED",
        }

        yield {
            "event": "run_started",
            "data": {
                "run_id": active_run_id,
                "user_id": user_id,
                "raw_instruction": instruction,
            },
        }

        for chunk in self.app.stream(initial_state, config=config, stream_mode="updates"):
            for node_name, node_output in chunk.items():
                if node_name == "parse_intent":
                    yield {
                        "event": "intent_extracted",
                        "data": {
                            "run_id": active_run_id,
                            "intent": node_output.get("intent"),
                            "requires_clarification": node_output.get("requires_clarification", False),
                            "clarification_prompt": node_output.get("clarification_prompt"),
                        },
                    }
                elif node_name == "plan_workflow":
                    yield {
                        "event": "plan_generated",
                        "data": {
                            "run_id": active_run_id,
                            "plan": node_output.get("plan"),
                        },
                    }
                elif node_name == "execute_step":
                    history = node_output.get("execution_history", [])
                    latest_step = history[-1] if history else None
                    yield {
                        "event": "step_executed",
                        "data": {
                            "run_id": active_run_id,
                            "latest_result": latest_step,
                            "status": node_output.get("status"),
                        },
                    }
                elif node_name == "synthesize_summary":
                    yield {
                        "event": "summary_synthesized",
                        "data": {
                            "run_id": active_run_id,
                            "final_summary": node_output.get("final_summary"),
                            "status": node_output.get("status"),
                        },
                    }

        curr_state = self.app.get_state(config)
        is_interrupted = False
        if curr_state and curr_state.tasks:
            for task in curr_state.tasks:
                if hasattr(task, "interrupts") and task.interrupts:
                    interrupt_val = task.interrupts[0].value
                    if isinstance(interrupt_val, dict) and interrupt_val.get("action") == "APPROVAL_REQUIRED":
                        is_interrupted = True
                        yield {
                            "event": "approval_required",
                            "data": {
                                "run_id": active_run_id,
                                "status": "SUSPENDED_APPROVAL",
                                "pending_approval": interrupt_val.get("request"),
                                "payload_hash": interrupt_val.get("payload_hash"),
                            },
                        }
                        break

        if not is_interrupted:
            final_status = curr_state.values.get("status", "COMPLETED") if curr_state else "COMPLETED"
            if final_status == "FAILED":
                yield {
                    "event": "run_failed",
                    "data": {
                        "run_id": active_run_id,
                        "status": "FAILED",
                        "error": curr_state.values.get("error", "Execution failed") if curr_state else "Unknown error",
                    },
                }
            elif curr_state and curr_state.values.get("requires_clarification"):
                yield {
                    "event": "clarification_needed",
                    "data": {
                        "run_id": active_run_id,
                        "status": "CLARIFICATION_NEEDED",
                        "clarification_prompt": curr_state.values.get("clarification_prompt"),
                    },
                }
            else:
                yield {
                    "event": "run_completed",
                    "data": {
                        "run_id": active_run_id,
                        "status": "COMPLETED",
                        "final_summary": curr_state.values.get("final_summary") if curr_state else None,
                    },
                }

    def stream_approve(
        self,
        run_id: str,
        decision: ApprovalStatus = ApprovalStatus.APPROVED,
        payload_hash: Optional[str] = None,
    ):
        """
        Resumes a paused workflow at SUSPENDED_APPROVAL and streams subsequent step execution.
        """
        config = {"configurable": {"thread_id": run_id}}
        current_state = self.app.get_state(config)
        if not current_state or not current_state.values:
            raise ValueError(f"No checkpoint found for run_id '{run_id}'")

        pending = None
        for task in current_state.tasks:
            if hasattr(task, "interrupts") and task.interrupts:
                interrupt_val = task.interrupts[0].value
                if isinstance(interrupt_val, dict) and "request" in interrupt_val:
                    pending = interrupt_val["request"]
                    break

        if not pending and current_state.values.get("pending_approval"):
            pending = current_state.values.get("pending_approval")

        if not pending:
            raise ValueError(f"Run '{run_id}' is not currently awaiting approval.")

        if pending and payload_hash and pending.get("payload_hash") != payload_hash:
            raise PermissionError("Approval payload hash mismatch: The payload was altered after suspension!")

        dec_val = decision.value if hasattr(decision, "value") else decision
        resume_command = Command(resume={"decision": dec_val, "payload_hash": payload_hash})

        yield {
            "event": "approval_resumed",
            "data": {
                "run_id": run_id,
                "decision": dec_val,
            },
        }

        for chunk in self.app.stream(resume_command, config=config, stream_mode="updates"):
            for node_name, node_output in chunk.items():
                if node_name == "execute_step":
                    history = node_output.get("execution_history", [])
                    latest_step = history[-1] if history else None
                    yield {
                        "event": "step_executed",
                        "data": {
                            "run_id": run_id,
                            "latest_result": latest_step,
                            "status": node_output.get("status"),
                        },
                    }
                elif node_name == "synthesize_summary":
                    yield {
                        "event": "summary_synthesized",
                        "data": {
                            "run_id": run_id,
                            "final_summary": node_output.get("final_summary"),
                            "status": node_output.get("status"),
                        },
                    }

        curr_state = self.app.get_state(config)
        is_interrupted = False
        if curr_state and curr_state.tasks:
            for task in curr_state.tasks:
                if hasattr(task, "interrupts") and task.interrupts:
                    interrupt_val = task.interrupts[0].value
                    if isinstance(interrupt_val, dict) and interrupt_val.get("action") == "APPROVAL_REQUIRED":
                        is_interrupted = True
                        yield {
                            "event": "approval_required",
                            "data": {
                                "run_id": run_id,
                                "status": "SUSPENDED_APPROVAL",
                                "pending_approval": interrupt_val.get("request"),
                                "payload_hash": interrupt_val.get("payload_hash"),
                            },
                        }
                        break

        if not is_interrupted:
            final_status = curr_state.values.get("status", "COMPLETED") if curr_state else "COMPLETED"
            if final_status == "FAILED":
                yield {
                    "event": "run_failed",
                    "data": {
                        "run_id": run_id,
                        "status": "FAILED",
                        "error": curr_state.values.get("error", "Execution failed") if curr_state else "Unknown error",
                    },
                }
            else:
                yield {
                    "event": "run_completed",
                    "data": {
                        "run_id": run_id,
                        "status": "COMPLETED",
                        "final_summary": curr_state.values.get("final_summary") if curr_state else None,
                    },
                }

    def _normalize_result(self, result: Dict[str, Any], run_id: str) -> AgentState:
        """
        Normalizes the LangGraph execution response.
        If an interrupt occurred, sets status='SUSPENDED_APPROVAL' and extracts pending approval.
        """
        config = {"configurable": {"thread_id": run_id}}
        current_state = self.app.get_state(config)

        # Check if the graph is currently halted at an interrupt
        if current_state.tasks:
            for task in current_state.tasks:
                if hasattr(task, "interrupts") and task.interrupts:
                    interrupt_info = task.interrupts[0].value
                    if isinstance(interrupt_info, dict) and interrupt_info.get("action") == "APPROVAL_REQUIRED":
                        result["status"] = "SUSPENDED_APPROVAL"
                        result["pending_approval"] = interrupt_info.get("request")
                        return result

        return result


orchestrator = AgentOrchestrator()
