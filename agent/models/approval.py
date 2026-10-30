from enum import Enum
from typing import Dict, Any, Optional
import hashlib
import json
from pydantic import BaseModel, Field
from agent.models.plan import RiskTier


class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class ApprovalRequest(BaseModel):
    approval_id: str = Field(..., description="Unique approval request ID")
    run_id: str = Field(..., description="Active workflow run ID")
    step_id: str = Field(..., description="Target plan step awaiting clearance")
    tool_name: str = Field(..., description="Name of the consequential tool to execute")
    summary: str = Field(..., description="Human-readable explanation of the action to be taken")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Exact parameters to pass to the tool")
    payload_hash: str = Field(default="", description="Cryptographic hash sealing the approved payload")
    risk_tier: RiskTier = Field(default=RiskTier.TIER_1_CONSEQUENTIAL)
    status: ApprovalStatus = Field(default=ApprovalStatus.PENDING)
    created_at: str = Field(..., description="ISO 8601 creation timestamp")
    compensating_summary: Optional[str] = Field(
        default=None, description="Explanation of how this action can be undone if reverted"
    )

    def seal_payload(self) -> str:
        """Compute SHA256 of canonical payload to guarantee it cannot be tampered with."""
        canonical = json.dumps(self.payload, sort_keys=True)
        self.payload_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        return self.payload_hash

    def verify_integrity(self, candidate_payload: Dict[str, Any]) -> bool:
        """Check if a candidate payload strictly matches the sealed hash."""
        candidate_canonical = json.dumps(candidate_payload, sort_keys=True)
        candidate_hash = hashlib.sha256(candidate_canonical.encode("utf-8")).hexdigest()
        return candidate_hash == self.payload_hash


class ApprovalResponse(BaseModel):
    approval_id: str
    run_id: str
    decision: ApprovalStatus  # APPROVED or REJECTED
    user_notes: Optional[str] = None
    decided_at: str
