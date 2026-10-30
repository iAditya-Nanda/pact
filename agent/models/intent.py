from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class IntentCategory(str, Enum):
    EMAIL = "EMAIL"
    CALENDAR = "CALENDAR"
    TASK = "TASK"
    CROSS_APP = "CROSS_APP"
    PREFERENCE = "PREFERENCE"
    UNKNOWN = "UNKNOWN"


class ActionType(str, Enum):
    QUERY = "QUERY"
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    EXECUTE = "EXECUTE"
    CLARIFY = "CLARIFY"


class ParsedIntent(BaseModel):
    category: IntentCategory = Field(
        ..., description="High-level category of the user's intent"
    )
    action: ActionType = Field(
        ..., description="Specific operational action to perform"
    )
    confidence: float = Field(
        default=1.0, ge=0.0, le=1.0, description="Confidence score of classification"
    )
    entities: Dict[str, Any] = Field(
        default_factory=dict, description="Extracted domain entities (names, dates, subjects, etc.)"
    )
    missing_fields: List[str] = Field(
        default_factory=list, description="Critical information missing for complete execution"
    )
    requires_clarification: bool = Field(
        default=False, description="Flag indicating user clarification is necessary before planning"
    )
    clarification_prompt: Optional[str] = Field(
        default=None, description="Question to ask the user if clarification is needed"
    )
    raw_instruction: str = Field(
        default="", description="The original user instruction"
    )
