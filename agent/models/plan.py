from enum import Enum
from typing import Dict, Any, List, Optional
import hashlib
import json
from pydantic import BaseModel, Field


class RiskTier(str, Enum):
    TIER_0_SAFE = "TIER_0_SAFE"                # Auto-executed (read-only, searches, queries)
    TIER_1_CONSEQUENTIAL = "TIER_1_CONSEQUENTIAL"  # Requires explicit human clearance (writes, sends, deletes)


class StepStatus(str, Enum):
    PENDING = "PENDING"
    SUSPENDED_APPROVAL = "SUSPENDED_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXECUTING = "EXECUTING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class PlanStep(BaseModel):
    step_id: str = Field(..., description="Unique deterministic identifier within the plan")
    tool_name: str = Field(..., description="Target tool adapter name to dispatch")
    risk_tier: RiskTier = Field(..., description="Risk tier determining authorization protocol")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Payload passed to the tool")
    dependencies: List[str] = Field(
        default_factory=list, description="List of ancestor step_ids that must succeed before this step"
    )
    idempotency_key: str = Field(default="", description="Deterministic cryptographic key to prevent duplicate execution")
    status: StepStatus = Field(default=StepStatus.PENDING, description="Current execution state of this step")
    result: Optional[Any] = Field(default=None, description="Output payload returned upon successful execution")
    error: Optional[str] = Field(default=None, description="Failure details if step encountered an error")

    def compute_idempotency_key(self, run_id: str) -> str:
        """Calculate SHA256(run_id + step_id + canonical_payload_json)."""
        payload_str = json.dumps(self.parameters, sort_keys=True)
        raw = f"{run_id}:{self.step_id}:{self.tool_name}:{payload_str}"
        self.idempotency_key = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        return self.idempotency_key


class ExecutionPlan(BaseModel):
    plan_id: str = Field(..., description="Unique plan UUID")
    run_id: str = Field(..., description="Active workflow run ID")
    objective: str = Field(..., description="Summary of the goal this plan solves")
    steps: List[PlanStep] = Field(default_factory=list, description="Ordered/DAG list of execution steps")
    current_step_index: int = Field(default=0, description="Pointer to the currently executing step")
    is_completed: bool = Field(default=False, description="Whether all steps have reached terminal states")

    def get_ready_steps(self) -> List[PlanStep]:
        """Returns steps whose dependencies have all completed with SUCCESS."""
        completed_step_ids = {s.step_id for s in self.steps if s.status == StepStatus.SUCCESS}
        ready = []
        for step in self.steps:
            if step.status == StepStatus.PENDING:
                if all(dep in completed_step_ids for dep in step.dependencies):
                    ready.append(step)
        return ready
