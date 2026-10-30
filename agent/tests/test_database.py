import tempfile
from pathlib import Path
import pytest
from agent.db.connection import DatabaseManager
from agent.db.schema import init_database, seed_mock_data
from agent.db.preferences_repo import PreferencesRepository
from agent.db.audit_repo import AuditRepository
from agent.models import (
    UserPreference,
    ConstraintType,
    PreferenceScope,
    RiskTier,
    StepStatus,
)


@pytest.fixture
def test_db():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test_pact.db"
        manager = DatabaseManager(db_path=db_path)
        init_database(manager)
        seed_mock_data(manager)
        yield manager


def test_database_initialization_and_mock_seed(test_db):
    pref_repo = PreferencesRepository(test_db)
    active_prefs = pref_repo.list_active()
    assert len(active_prefs) >= 2

    with test_db.get_connection() as conn:
        email_count = conn.execute("SELECT COUNT(*) FROM mock_emails").fetchone()[0]
        cal_count = conn.execute("SELECT COUNT(*) FROM mock_calendar_events").fetchone()[0]
        task_count = conn.execute("SELECT COUNT(*) FROM mock_tasks").fetchone()[0]
        assert email_count >= 1
        assert cal_count >= 2
        assert task_count >= 1


def test_preference_crud(test_db):
    pref_repo = PreferencesRepository(test_db)
    new_pref = UserPreference(
        preference_id="pref_custom_friday",
        user_id="default_user",
        scope=PreferenceScope.CALENDAR,
        rule_key="no_friday_afternoon_calls",
        description="No meetings on Friday after 2 PM",
        constraint_type=ConstraintType.HARD,
        parameters={"day": "Friday", "cutoff": "14:00"},
        allowed_overrides=[],
    )
    pref_repo.create_or_update(new_pref)

    fetched = pref_repo.get_by_id("pref_custom_friday")
    assert fetched is not None
    assert fetched.rule_key == "no_friday_afternoon_calls"
    assert fetched.constraint_type == ConstraintType.HARD

    # Test soft delete / deactivation
    fetched.is_active = False
    pref_repo.create_or_update(fetched)
    active = pref_repo.list_active()
    assert "pref_custom_friday" not in [p.preference_id for p in active]


def test_soft_vs_hard_constraint_evaluation(test_db):
    pref_repo = PreferencesRepository(test_db)

    # 1. Test Soft Constraint: Meeting at 09:00 AM (violates "no meetings before 10 AM")
    # For a regular contact: must be rejected
    allowed, reason, violated = pref_repo.evaluate_calendar_slot(
        start_time_str="2026-10-31 09:00:00",
        end_time_str="2026-10-31 09:30:00",
        attendee_email="regular.colleague@acme.corp",
    )
    assert not allowed
    assert "Violates preference" in reason
    assert violated.constraint_type == ConstraintType.SOFT

    # For a VIP contact in allowed_overrides: must pass through
    allowed_vip, _, _ = pref_repo.evaluate_calendar_slot(
        start_time_str="2026-10-31 09:00:00",
        end_time_str="2026-10-31 09:30:00",
        attendee_email="sarah.chen@acme.corp",
    )
    assert allowed_vip  # VIP override accepted!

    # 2. Test Hard Constraint: Meeting at 15:30 (child pickup block 15:00-16:00)
    # Even for a VIP, hard constraints must NEVER be overridden
    allowed_hard, hard_reason, hard_violated = pref_repo.evaluate_calendar_slot(
        start_time_str="2026-10-31 15:30:00",
        end_time_str="2026-10-31 16:00:00",
        attendee_email="sarah.chen@acme.corp",
    )
    assert not allowed_hard
    assert "HARD constraint" in hard_reason
    assert hard_violated.constraint_type == ConstraintType.HARD


def test_audit_repository_and_idempotency(test_db):
    audit_repo = AuditRepository(test_db)
    idempotency_key = "test_sha256_idempotency_key_12345"

    # Verify key does not exist yet
    assert audit_repo.get_by_idempotency_key(idempotency_key) is None

    # Log action start
    audit_repo.log_action_start(
        action_id="act_001",
        run_id="run_999",
        step_id="step_1",
        tool_name="send_email",
        risk_tier=RiskTier.TIER_1_CONSEQUENTIAL,
        parameters={"to": "sarah.chen@acme.corp", "subject": "Update"},
        payload_hash="hash_abc_123",
        idempotency_key=idempotency_key,
    )

    # Key must now exist with status EXECUTING
    record = audit_repo.get_by_idempotency_key(idempotency_key)
    assert record is not None
    assert record["status"] == StepStatus.EXECUTING.value
    assert record["tool_name"] == "send_email"

    # Record successful completion & verification
    audit_repo.record_action_result(
        action_id="act_001",
        status=StepStatus.SUCCESS,
        result={"message_id": "msg_gmail_987"},
        is_verified=True,
        verification_details="Verified email message_id in provider outbox",
    )

    completed_record = audit_repo.get_by_idempotency_key(idempotency_key)
    assert completed_record["status"] == StepStatus.SUCCESS.value
    assert completed_record["is_verified"] is True
    assert completed_record["result"]["message_id"] == "msg_gmail_987"
