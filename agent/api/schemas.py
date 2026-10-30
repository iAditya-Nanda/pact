from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from agent.models.approval import ApprovalStatus
from agent.models.preferences import ConstraintType, PreferenceScope
from agent.models.alerts import ProactiveAlertType, AlertSeverity


class ChatRequest(BaseModel):
    instruction: str = Field(..., description="User prompt or instruction for the agent")
    user_id: str = Field(default="default_user", description="Identifier of the user")
    run_id: Optional[str] = Field(default=None, description="Optional existing or client-specified run ID")


class ChatResponse(BaseModel):
    run_id: str
    status: str
    raw_instruction: str
    intent: Optional[Dict[str, Any]] = None
    plan: Optional[Dict[str, Any]] = None
    pending_approval: Optional[Dict[str, Any]] = None
    execution_history: List[Dict[str, Any]] = Field(default_factory=list)
    compensating_log: List[Dict[str, Any]] = Field(default_factory=list)
    final_summary: Optional[str] = None
    error: Optional[str] = None


class ApprovalRequestModel(BaseModel):
    run_id: str = Field(..., description="Run ID of the suspended workflow")
    decision: ApprovalStatus = Field(default=ApprovalStatus.APPROVED, description="APPROVED or REJECTED")
    payload_hash: Optional[str] = Field(default=None, description="SHA256 payload hash from approval request card")


class RollbackRequest(BaseModel):
    run_id: str = Field(..., description="Run ID of the completed workflow to revert")


class RollbackResponse(BaseModel):
    run_id: str
    status: str
    reverted_count: int
    reverted_actions: List[Dict[str, Any]] = Field(default_factory=list)


class PreferenceCreateRequest(BaseModel):
    user_id: str = Field(default="default_user")
    scope: PreferenceScope = Field(default=PreferenceScope.CALENDAR, description="CALENDAR, EMAIL, TASK, GENERAL")
    rule_key: str = Field(..., description="Machine-readable rule identifier")
    description: str = Field(..., description="Human-readable rule explanation")
    constraint_type: ConstraintType = Field(default=ConstraintType.SOFT, description="HARD or SOFT")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured rule parameters")
    allowed_overrides: List[str] = Field(default_factory=list, description="Allowed override emails or roles")
    is_active: bool = Field(default=True)


class PreferenceResponse(BaseModel):
    preference_id: str
    user_id: str
    scope: str
    rule_key: str
    description: str
    constraint_type: str
    parameters: Dict[str, Any]
    allowed_overrides: List[str]
    is_active: bool


class AlertResponse(BaseModel):
    alert_id: str
    alert_type: str
    severity: str
    title: str
    description: str
    detected_entities: Dict[str, Any] = Field(default_factory=dict)
    proposed_resolution: Optional[str] = None
    proposed_action: Optional[Dict[str, Any]] = None
    status: str
    created_at: str


class AlertDismissResponse(BaseModel):
    alert_id: str
    status: str


class HealthResponse(BaseModel):
    status: str
    database: str
    llm_engine: str
    active_tools: List[str]
