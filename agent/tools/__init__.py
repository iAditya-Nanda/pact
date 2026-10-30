from agent.tools.base import (
    IEmailService,
    ICalendarService,
    ITaskService,
    EmailMessage,
    CalendarEvent,
    TaskItem,
)
from agent.tools.mock_email import MockEmailAdapter
from agent.tools.mock_calendar import MockCalendarAdapter
from agent.tools.mock_tasks import MockTaskAdapter
from agent.tools.registry import ToolRegistry, tool_registry

__all__ = [
    "IEmailService",
    "ICalendarService",
    "ITaskService",
    "EmailMessage",
    "CalendarEvent",
    "TaskItem",
    "MockEmailAdapter",
    "MockCalendarAdapter",
    "MockTaskAdapter",
    "ToolRegistry",
    "tool_registry",
]
