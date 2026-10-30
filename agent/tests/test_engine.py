import pytest
from agent.engine.client import LocalLLMClient
from agent.engine.intent_service import IntentExtractionService
from agent.engine.planner_service import DAGPlanningService
from agent.models import (
    ParsedIntent,
    IntentCategory,
    ActionType,
    ExecutionPlan,
    RiskTier,
    StepStatus,
    UserPreference,
    ConstraintType,
    PreferenceScope,
)


def test_clean_json_string():
    client = LocalLLMClient()
    raw_markdown = "```json\n{\"category\": \"EMAIL\", \"action\": \"QUERY\"}\n```"
    cleaned = client._clean_json_string(raw_markdown)
    assert cleaned == "{\"category\": \"EMAIL\", \"action\": \"QUERY\"}"

    raw_plain = "{\"status\": \"ok\"}"
    assert client._clean_json_string(raw_plain) == "{\"status\": \"ok\"}"


def test_intent_service_fallback():
    service = IntentExtractionService()
    intent = service._heuristic_fallback("Reschedule my meeting with Sarah to 2 PM")
    parsed = ParsedIntent.model_validate(intent)
    assert parsed.category == IntentCategory.CALENDAR
    assert parsed.action == ActionType.UPDATE


def test_planner_service_dag_generation():
    planner = DAGPlanningService()
    intent = ParsedIntent(
        category=IntentCategory.CROSS_APP,
        action=ActionType.EXECUTE,
        confidence=0.95,
        entities={"sender": "Sarah", "topic": "release review"},
        raw_instruction="Find email from Sarah, check task due date, and hold 30m on calendar",
    )
    pref = UserPreference(
        preference_id="pref_001",
        user_id="default_user",
        scope=PreferenceScope.CALENDAR,
        rule_key="no_meetings_before_10am",
        description="Preserve morning focus",
        constraint_type=ConstraintType.SOFT,
    )

    plan = planner.generate_plan(intent=intent, preferences=[pref], run_id="run_unit_test_01")
    assert isinstance(plan, ExecutionPlan)
    assert plan.run_id == "run_unit_test_01"
    assert len(plan.steps) >= 3

    # Verify that mutating step is marked TIER_1_CONSEQUENTIAL
    consequential_steps = [s for s in plan.steps if s.risk_tier == RiskTier.TIER_1_CONSEQUENTIAL]
    assert len(consequential_steps) >= 1

    # Verify that all steps have valid 64-char SHA256 idempotency keys
    for step in plan.steps:
        assert len(step.idempotency_key) == 64

    # Verify ready steps logic (first step with no dependencies must be ready)
    ready = plan.get_ready_steps()
    assert len(ready) >= 1
    assert ready[0].status == StepStatus.PENDING
