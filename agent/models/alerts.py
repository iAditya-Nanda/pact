from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class ProactiveAlertType(str, Enum):
    SCHEDULE_CONFLICT = "SCHEDULE_CONFLICT"
    PREFERENCE_VIOLATION = "PREFERENCE_VIOLATION"
    IMPENDING_DEADLINE = "IMPENDING_DEADLINE"
    TRI_VECTOR_DEADLOCK = "TRI_VECTOR_DEADLOCK"
    UNANSWERED_URGENT_EMAIL = "UNANSWERED_URGENT_EMAIL"


class AlertSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ProactiveAlert(BaseModel):
    alert_id: str = Field(..., description="Unique alert identifier")
    alert_type: ProactiveAlertType = Field(..., description="Category of the detected issue")
    severity: AlertSeverity = Field(default=AlertSeverity.MEDIUM)
    title: str = Field(..., description="Concise, high-level alert summary")
    description: str = Field(..., description="Detailed context explaining why this alert was generated")
    detected_entities: Dict[str, Any] = Field(default_factory=dict, description="Related event, task, or email data")
    proposed_resolution: Optional[str] = Field(default=None, description="Recommended course of action")
    proposed_action: Optional[Dict[str, Any]] = Field(
        default=None, description="Machine-readable tool parameters to resolve the issue with 1 click"
    )
    status: str = Field(default="UNRESOLVED")  # UNRESOLVED, DISMISSED, ACTIONED
    created_at: str = Field(default="")
