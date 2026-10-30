import pytest
from agent.models import (
    IntentCategory,
    ActionType,
    ParsedIntent,
    RiskTier,
    StepStatus,
    PlanStep,
    ExecutionPlan,
    ApprovalStatus,
    ApprovalRequest,
    ConstraintType,
    PreferenceScope,
    UserPreference,
)


def test_parsed_intent_model():
    intent = ParsedIntent(
        category=IntentCategory.CALENDAR,
        action=ActionType.UPDATE,
        confidence=0.98,
        entities={"person": "Sarah Chen", "proposed_time": "14:00"},
        raw_instruction="Reschedule meeting with Sarah to 2 PM",
    )
    assert intent.category == IntentCategory.CALENDAR
    assert intent.action == ActionType.UPDATE
    assert intent.confidence == 0.98
    assert intent.entities["person"] == "Sarah Chen"
    assert not intent.requires_clarification


def test_plan_step_idempotency_computation():
    step = PlanStep(
        step_id="step_001",
        tool_name="reschedule_event",
        risk_tier=RiskTier.TIER_1_CONSEQUENTIAL,
        parameters={"event_id": "evt_999", "new_start": "2026-10-31 14:00"},
    )
    key1 = step.compute_idempotency_key(run_id="run_123")
    key2 = step.compute_idempotency_key(run_id="run_123")
    # Same inputs must produce exact same deterministic hash
    assert key1 == key2
    assert len(key1) == 64  # SHA-256


def test_execution_plan_ready_steps():
    step1 = PlanStep(
        step_id="step_1",
        tool_name="search_email",
        risk_tier=RiskTier.TIER_0_SAFE,
        status=StepStatus.SUCCESS,
    )
    step2 = PlanStep(
        step_id="step_2",
        tool_name="check_calendar",
        risk_tier=RiskTier.TIER_0_SAFE,
        status=StepStatus.SUCCESS,
    )
    step3 = PlanStep(
        step_id="step_3",
        tool_name="reschedule_event",
        risk_tier=RiskTier.TIER_1_CONSEQUENTIAL,
        dependencies=["step_1", "step_2"],
        status=StepStatus.PENDING,
    )
    plan = ExecutionPlan(
        plan_id="plan_001",
        run_id="run_123",
        objective="Reschedule meeting after email check",
        steps=[step1, step2, step3],
    )
    ready = plan.get_ready_steps()
    assert len(ready) == 1
    assert ready[0].step_id == "step_3"


def test_approval_request_payload_sealing():
    req = ApprovalRequest(
        approval_id="appr_001",
        run_id="run_123",
        step_id="step_3",
        tool_name="send_email",
        summary="Send confirmation to Sarah Chen",
        payload={"to": "sarah.chen@acme.corp", "subject": "Rescheduled sync"},
        created_at="2026-10-30T21:00:00Z",
    )
    sealed_hash = req.seal_payload()
    assert len(sealed_hash) == 64

    # Verify matching payload
    assert req.verify_integrity({"to": "sarah.chen@acme.corp", "subject": "Rescheduled sync"})

    # Tampered payload must fail verification
    assert not req.verify_integrity({"to": "attacker@evil.com", "subject": "Rescheduled sync"})


def test_user_preference_model():
    pref = UserPreference(
        preference_id="pref_001",
        scope=PreferenceScope.CALENDAR,
        rule_key="no_meetings_before_10am",
        description="Preserve early morning focus",
        constraint_type=ConstraintType.SOFT,
        parameters={"cutoff_time": "10:00"},
        allowed_overrides=["sarah.chen@acme.corp"],
    )
    assert pref.constraint_type == ConstraintType.SOFT
    assert "sarah.chen@acme.corp" in pref.allowed_overrides
