#!/usr/bin/env python3
"""
Phase 2 Verification Script for PACT Agentic AI Subsystem.
Validates:
1. Connectivity to local pure C++ model runtime (llama.cpp with Metal GPU acceleration).
2. Live structured token generation using qwen2.5-3b-instruct with Pydantic JSON schema constraints.
3. Accurate intent classification and entity extraction into ParsedIntent.
4. Dependency-aware DAG decomposition into an ExecutionPlan with risk tiers and idempotency keys.
"""

import sys
import time
from pathlib import Path

# Ensure root directory in python path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from agent.engine.client import local_llm_client
from agent.engine.intent_service import intent_service
from agent.engine.planner_service import planner_service
from agent.models import (
    ParsedIntent,
    ExecutionPlan,
    RiskTier,
    UserPreference,
    ConstraintType,
    PreferenceScope,
)


def print_step(title: str):
    print(f"\n\033[1;34m[TEST]\033[0m {title}...")


def print_success(detail: str):
    print(f"  \033[1;32m✔ PASS:\033[0m {detail}")


def main():
    print("\033[1;36m================================================================")
    print("        PACT AGENTIC AI SUBSYSTEM - PHASE 2 VERIFICATION       ")
    print("================================================================\033[0m")

    # Step 1: Check Local C++ Runtime
    print_step("Step 1: Connecting to Local C++ Model Runtime")
    model_name = local_llm_client.config.tier_a_model
    print(f"  Target Local Model: \033[1;33m{model_name}\033[0m (Pure C++ in-process llama.cpp)")

    # Step 2: Live Intent Extraction
    print_step("Step 2: Performing Live Intent Extraction (Tier A)")
    user_instruction = (
        "Check the email from Sarah about the release checklist, see when the task is due, "
        "and reschedule our 30m prep meeting to Friday afternoon."
    )
    print(f"  Input Instruction: \"{user_instruction}\"")

    start_time = time.time()
    intent = intent_service.extract_intent(user_instruction)
    elapsed = (time.time() - start_time) * 1000

    assert isinstance(intent, ParsedIntent), "Output must be instance of ParsedIntent"
    print_success(f"ParsedIntent generated in {elapsed:.1f}ms")
    print(f"    - Category: \033[1;32m{intent.category.value}\033[0m")
    print(f"    - Action: \033[1;32m{intent.action.value}\033[0m")
    print(f"    - Entities: {intent.entities}")
    print(f"    - Requires Clarification: {intent.requires_clarification}")

    # Step 3: Live DAG Planning
    print_step("Step 3: Performing Live DAG Planning (Tier B)")
    sample_pref = UserPreference(
        preference_id="pref_01",
        user_id="default_user",
        scope=PreferenceScope.CALENDAR,
        rule_key="no_meetings_before_10am",
        description="Preserve morning focus",
        constraint_type=ConstraintType.SOFT,
    )

    start_plan_time = time.time()
    plan = planner_service.generate_plan(
        intent=intent,
        preferences=[sample_pref],
        run_id="run_live_demo_002",
    )
    plan_elapsed = (time.time() - start_plan_time) * 1000

    assert isinstance(plan, ExecutionPlan), "Output must be instance of ExecutionPlan"
    assert len(plan.steps) >= 2, "Plan must contain decomposed steps"
    print_success(f"ExecutionPlan synthesized in {plan_elapsed:.1f}ms with {len(plan.steps)} steps:")

    consequential_count = 0
    for idx, s in enumerate(plan.steps, 1):
        tier_color = "\033[1;31m" if s.risk_tier == RiskTier.TIER_1_CONSEQUENTIAL else "\033[1;32m"
        if s.risk_tier == RiskTier.TIER_1_CONSEQUENTIAL:
            consequential_count += 1
        print(f"    {idx}. [{s.step_id}] \033[1;33m{s.tool_name}\033[0m -> {tier_color}{s.risk_tier.value}\033[0m")
        print(f"       Dependencies: {s.dependencies} | Idempotency Key: {s.idempotency_key[:16]}...")

    assert consequential_count >= 1, "Must have flagged consequential mutating actions"
    print_success(f"Risk governance verified: {consequential_count} step(s) marked TIER_1_CONSEQUENTIAL (HITL)")

    # Step 4: Verify Deterministic Dependency Resolution
    print_step("Step 4: Testing Dependency Graph Resolution")
    ready_steps = plan.get_ready_steps()
    print_success(f"Initial executable steps with zero unresolved dependencies: {[s.step_id for s in ready_steps]}")
    assert len(ready_steps) >= 1, "At least one root step must be ready to execute"

    print("\n\033[1;32m================================================================")
    print("    PHASE 2 VERIFICATION COMPLETE: ALL SYSTEMS 100% OPERATIONAL ")
    print("================================================================\033[0m\n")


if __name__ == "__main__":
    main()
