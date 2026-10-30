from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from agent.models.tools import ToolExecutionResult, VerificationResult
from agent.models.plan import RiskTier


# --- Domain Data Transfer Objects (DTOs) ---

class EmailMessage(BaseModel):
    email_id: str
    sender: str
    recipient: str
    subject: str
    body: str
    priority: str = "NORMAL"
    is_read: bool = False
    status: str = "INBOX"  # INBOX, SENT, DRAFT, TRASH
    received_at: str = ""


class CalendarEvent(BaseModel):
    event_id: str
    title: str
    description: Optional[str] = None
    start_time: str
    end_time: str
    attendees: List[str] = Field(default_factory=list)
    status: str = "CONFIRMED"  # CONFIRMED, TENTATIVE, CANCELLED


class TaskItem(BaseModel):
    task_id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: str = "MEDIUM"  # LOW, MEDIUM, HIGH, URGENT
    status: str = "PENDING"   # PENDING, IN_PROGRESS, COMPLETED, CANCELLED


# --- Abstract Service Interfaces ---

class IEmailService(ABC):
    @abstractmethod
    def search_inbox(self, query: str, limit: int = 10) -> List[EmailMessage]:
        """Search messages matching a keyword or sender query (Safe - Tier 0)."""
        pass

    @abstractmethod
    def read_email(self, email_id: str) -> Optional[EmailMessage]:
        """Fetch details of a specific email message (Safe - Tier 0)."""
        pass

    @abstractmethod
    def create_draft(self, recipient: str, subject: str, body: str) -> Dict[str, Any]:
        """Create an email draft without sending (Safe - Tier 0)."""
        pass

    @abstractmethod
    def send_email(
        self,
        recipient: str,
        subject: str,
        body: str,
        draft_id: Optional[str] = None,
        idempotency_key: str = "",
    ) -> Dict[str, Any]:
        """Send an email message (Consequential - Tier 1)."""
        pass


class ICalendarService(ABC):
    @abstractmethod
    def list_events(self, start_time: str, end_time: str) -> List[CalendarEvent]:
        """List active events within a date-time window (Safe - Tier 0)."""
        pass

    @abstractmethod
    def check_conflicts(self, proposed_start: str, proposed_end: str) -> Dict[str, Any]:
        """Check for overlapping schedule commitments (Safe - Tier 0)."""
        pass

    @abstractmethod
    def create_event(
        self,
        title: str,
        start_time: str,
        end_time: str,
        attendees: Optional[List[str]] = None,
        description: Optional[str] = None,
        idempotency_key: str = "",
    ) -> CalendarEvent:
        """Schedule a new calendar appointment (Consequential - Tier 1)."""
        pass

    @abstractmethod
    def reschedule_event(
        self,
        event_id: str,
        new_start: str,
        new_end: str,
        idempotency_key: str = "",
    ) -> Dict[str, Any]:
        """Update appointment start/end times with rollback snapshot (Consequential - Tier 1)."""
        pass

    @abstractmethod
    def cancel_event(
        self,
        event_id: str,
        reason: Optional[str] = None,
        idempotency_key: str = "",
    ) -> Dict[str, Any]:
        """Mark an appointment as cancelled (Consequential - Tier 1)."""
        pass


class ITaskService(ABC):
    @abstractmethod
    def list_tasks(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
    ) -> List[TaskItem]:
        """List active tasks matching filters (Safe - Tier 0)."""
        pass

    @abstractmethod
    def create_task(
        self,
        title: str,
        description: Optional[str] = None,
        due_date: Optional[str] = None,
        priority: str = "MEDIUM",
        idempotency_key: str = "",
    ) -> TaskItem:
        """Create a new action item (Safe - Tier 0)."""
        pass

    @abstractmethod
    def complete_task(
        self,
        task_id: str,
        idempotency_key: str = "",
    ) -> Dict[str, Any]:
        """Mark a task as completed (Consequential - Tier 1)."""
        pass
