import tempfile
from pathlib import Path
import pytest
from agent.db.connection import DatabaseManager
from agent.db.schema import init_database, seed_mock_data
from agent.core.orchestrator import AgentOrchestrator
from agent.models.approval import ApprovalStatus


@pytest.fixture
def test_orch():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test_orch.db"
        manager = DatabaseManager(db_path=db_path)
        init_database(manager)
        seed_mock_data(manager)
        orch = AgentOrchestrator(manager=manager)
        yield orch, manager


def test_ambiguous_instruction_triggers_clarification(test_orch):
    orch, _ = test_orch
    state = orch.run(instruction="Cancel my meeting", run_id="run_test_clarify")
    assert state["status"] == "CLARIFICATION_NEEDED"
    assert state["requires_clarification"] is True
    assert "Which meeting" in state["clarification_prompt"]


def test_consequential_workflow_suspends_and_resumes(test_orch):
    orch, _ = test_orch
    # This instruction involves checking conflicts and rescheduling an event (consequential)
    state = orch.run(
        instruction="Move my meeting with Sarah to tomorrow at 2 PM",
        run_id="run_test_suspend",
    )

    # Must be suspended waiting for clearance
    assert state["status"] == "SUSPENDED_APPROVAL"
    assert state["pending_approval"] is not None

    pending = state["pending_approval"]
    sealed_hash = pending["payload_hash"]
    assert len(sealed_hash) == 64

    # Test tampering rejection: an altered hash must raise PermissionError
    with pytest.raises(PermissionError):
        orch.approve_and_resume(
            run_id="run_test_suspend",
            decision=ApprovalStatus.APPROVED,
            payload_hash="tampered_hash_0000000000000000000000000000000000000000000000000000",
        )

    # Test valid approval resumption
    resumed = orch.approve_and_resume(
        run_id="run_test_suspend",
        decision=ApprovalStatus.APPROVED,
        payload_hash=sealed_hash,
    )
    while resumed.get("status") == "SUSPENDED_APPROVAL":
        resumed = orch.approve_and_resume(
            run_id="run_test_suspend",
            decision=ApprovalStatus.APPROVED,
            payload_hash=resumed["pending_approval"]["payload_hash"],
        )
    assert resumed["status"] == "COMPLETED"
    assert len(resumed["execution_history"]) >= 1


def test_one_click_compensating_rollback(test_orch):
    orch, manager = test_orch
    # Run a reschedule flow
    state = orch.run(
        instruction="Move my meeting with Sarah to tomorrow at 4 PM",
        run_id="run_test_rollback",
    )
    assert state["status"] == "SUSPENDED_APPROVAL"

    # Approve (and approve any subsequent consequential steps if generated in the plan)
    resumed = orch.approve_and_resume(
        run_id="run_test_rollback",
        decision=ApprovalStatus.APPROVED,
        payload_hash=state["pending_approval"]["payload_hash"],
    )
    while resumed.get("status") == "SUSPENDED_APPROVAL":
        resumed = orch.approve_and_resume(
            run_id="run_test_rollback",
            decision=ApprovalStatus.APPROVED,
            payload_hash=resumed["pending_approval"]["payload_hash"],
        )
    assert resumed["status"] == "COMPLETED"
    assert len(resumed["compensating_log"]) >= 1

    # Execute 1-click rollback
    revert_result = orch.revert_run(run_id="run_test_rollback")
    assert revert_result["status"] == "REVERTED"
    assert revert_result["reverted_count"] >= 1
