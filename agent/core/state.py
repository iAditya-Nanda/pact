from typing import Dict, Any, List, Optional, TypedDict
from agent.models.intent import ParsedIntent
from agent.models.plan import ExecutionPlan, PlanStep
from agent.models.approval import ApprovalRequest, ApprovalResponse


class AgentState(TypedDict, total=False):
    """
    Typed state dictionary representing the complete state of a workflow execution.
    Persisted durable across LangGraph checkpoints in SQLite / PostgreSQL.
    """
    run_id: str
    user_id: str
    raw_instruction: str
    
    # Intent Analysis
    intent: Optional[Dict[str, Any]]
    requires_clarification: bool
    clarification_prompt: Optional[str]

    # Execution Plan
    plan: Optional[Dict[str, Any]]
    current_step_id: Optional[str]

    # Governance & Human-in-the-Loop
    pending_approval: Optional[Dict[str, Any]]
    approval_response: Optional[Dict[str, Any]]

    # Execution Ledger & Rollback
    execution_history: List[Dict[str, Any]]
    compensating_log: List[Dict[str, Any]]  # Rollback steps for 1-click undo

    # Workflow Status
    status: str  # INITIALIZED, PLANNING, SUSPENDED_APPROVAL, EXECUTING, COMPLETED, FAILED, CLARIFICATION_NEEDED
    final_summary: Optional[str]
    error: Optional[str]
