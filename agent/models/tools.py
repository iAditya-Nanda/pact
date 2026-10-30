from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class ToolExecutionStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    VERIFIED = "VERIFIED"
    RECONCILIATION_FAILED = "RECONCILIATION_FAILED"


class ToolCallRequest(BaseModel):
    call_id: str
    run_id: str
    step_id: str
    tool_name: str
    parameters: Dict[str, Any]
    idempotency_key: str


class VerificationResult(BaseModel):
    is_verified: bool
    verified_resource_id: Optional[str] = None
    verification_details: str
    observed_state: Optional[Dict[str, Any]] = None


class ToolExecutionResult(BaseModel):
    call_id: str
    tool_name: str
    status: ToolExecutionStatus
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    idempotency_key: str
    verification: Optional[VerificationResult] = None
    elapsed_ms: int = 0
