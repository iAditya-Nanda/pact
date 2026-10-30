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
        if not current_state:
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
            reverted_actions.append(res.model_dump())

        return {
            "run_id": run_id,
            "reverted_count": len(reverted_actions),
            "reverted_actions": reverted_actions,
            "status": "REVERTED",
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
