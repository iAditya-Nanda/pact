from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ConstraintType(str, Enum):
    HARD = "HARD"  # Absolute rule: agent can NEVER violate (e.g. child pickup, critical personal time)
    SOFT = "SOFT"  # Preferred rule: agent avoids violating, but VIPs/exceptions can override with approval


class PreferenceScope(str, Enum):
    CALENDAR = "CALENDAR"
    EMAIL = "EMAIL"
    TASK = "TASK"
    GENERAL = "GENERAL"


class UserPreference(BaseModel):
    preference_id: str = Field(..., description="Unique identifier for the preference rule")
    user_id: str = Field(default="default_user", description="Owner user ID")
    scope: PreferenceScope = Field(..., description="Domain scope (CALENDAR, EMAIL, TASK)")
    rule_key: str = Field(..., description="Machine-readable rule identifier (e.g. 'no_meetings_before_10am')")
    description: str = Field(..., description="Human-readable rule explanation")
    constraint_type: ConstraintType = Field(default=ConstraintType.SOFT)
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Structured rule parameters (e.g. {'cutoff_time': '10:00'})")
    allowed_overrides: List[str] = Field(
        default_factory=list, description="Contact emails or roles allowed to request soft overrides"
    )
    is_active: bool = Field(default=True, description="Whether rule is currently enforced")
