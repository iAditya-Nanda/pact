import tempfile
from pathlib import Path
import pytest
from agent.db.connection import DatabaseManager
from agent.db.schema import init_database, seed_mock_data
from agent.tools.registry import ToolRegistry
from agent.models.plan import RiskTier
from agent.models.tools import ToolExecutionStatus


@pytest.fixture
def test_tools():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test_tools.db"
        manager = DatabaseManager(db_path=db_path)
        init_database(manager)
        seed_mock_data(manager)
        registry = ToolRegistry(manager=manager)
        yield registry, manager


def test_email_adapter_workflow(test_tools):
    registry, _ = test_tools
    # 1. Search email
    emails = registry.email_adapter.search_inbox(query="Sarah")
    assert len(emails) >= 1
    assert "sarah" in emails[0].sender.lower()

    # 2. Draft email
    draft = registry.email_adapter.create_draft(
        recipient="sarah.chen@acme.corp",
        subject="Re: Prep meeting",
        body="Let us sync at 2 PM",
    )
    assert draft["status"] == "DRAFT"

    # 3. Send email (consequential)
    res = registry.execute_tool(
        tool_name="send_email",
        parameters={
            "recipient": "sarah.chen@acme.corp",
            "subject": "Re: Prep meeting",
            "body": "Let us sync at 2 PM",
            "draft_id": draft["draft_id"],
        },
        run_id="run_001",
        step_id="step_send",
        idempotency_key="key_send_email_123",
    )
    assert res.status == ToolExecutionStatus.VERIFIED
    assert res.verification.is_verified is True


def test_calendar_adapter_conflicts_and_reschedule(test_tools):
    registry, _ = test_tools

    # 1. Check interval conflict (Sprint Planning is 10:00 - 11:30)
    conflict_check = registry.calendar_adapter.check_conflicts(
        proposed_start="2026-10-31 10:30:00",
        proposed_end="2026-10-31 11:00:00",
    )
    assert conflict_check["has_conflict"] is True
    assert conflict_check["conflict_count"] >= 1

    # Check non-conflicting slot (12:00 - 13:00)
    clear_check = registry.calendar_adapter.check_conflicts(
        proposed_start="2026-10-31 12:00:00",
        proposed_end="2026-10-31 13:00:00",
    )
    assert clear_check["has_conflict"] is False

    # 2. Reschedule with rollback snapshot
    reschedule_res = registry.execute_tool(
        tool_name="reschedule_calendar_event",
        parameters={
            "event_id": "evt_001",
            "new_start": "2026-10-31 16:30:00",
            "new_end": "2026-10-31 17:30:00",
        },
        run_id="run_001",
        step_id="step_reschedule",
        idempotency_key="key_reschedule_evt_001",
    )
    assert reschedule_res.status == ToolExecutionStatus.VERIFIED
    assert reschedule_res.verification.is_verified is True
    # Verify rollback metadata is present
    assert "compensating_action" in reschedule_res.data
    assert reschedule_res.data["compensating_action"]["parameters"]["new_start"] == "2026-10-31 10:00:00"


def test_task_adapter_workflow(test_tools):
    registry, _ = test_tools

    # 1. Create task
    task = registry.task_adapter.create_task(
        title="Review Q3 Financials",
        due_date="2026-11-01 17:00:00",
        priority="HIGH",
    )
    assert task.status == "PENDING"

    # 2. Complete task via registry
    res = registry.execute_tool(
        tool_name="complete_task",
        parameters={"task_id": task.task_id},
        run_id="run_001",
        step_id="step_complete_task",
        idempotency_key="key_complete_task_456",
    )
    assert res.status == ToolExecutionStatus.VERIFIED
    assert res.verification.is_verified is True


def test_idempotency_deduplication_prevents_duplicate_actions(test_tools):
    registry, _ = test_tools
    idempotency_key = "idemp_send_email_strict_test"

    # First execution: must run and succeed
    res1 = registry.execute_tool(
        tool_name="send_email",
        parameters={
            "recipient": "client@acme.corp",
            "subject": "Proposal",
            "body": "Here is the proposal",
        },
        run_id="run_retry_test",
        step_id="step_1",
        idempotency_key=idempotency_key,
    )
    assert res1.status == ToolExecutionStatus.VERIFIED
    msg_id = res1.data["message_id"]

    # Second execution with exact same key: must NOT run again, must return cached verified result
    res2 = registry.execute_tool(
        tool_name="send_email",
        parameters={
            "recipient": "client@acme.corp",
            "subject": "Proposal",
            "body": "Here is the proposal",
        },
        run_id="run_retry_test",
        step_id="step_1",
        idempotency_key=idempotency_key,
    )
    assert res2.status == ToolExecutionStatus.VERIFIED
    assert res2.data["message_id"] == msg_id
    assert "Idempotency Cache Hit" in res2.verification.verification_details
