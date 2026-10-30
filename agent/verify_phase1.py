#!/usr/bin/env python3
"""
Phase 1 Verification Script for PACT Agentic AI Subsystem.
Validates:
1. Pydantic contracts and integrity sealing.
2. SQLite database initialization in database/pact_agent.db.
3. User preferences engine with Hard vs. Soft VIP constraint evaluation.
4. Action audit logging and cryptographic idempotency ledger.
5. Seeding of realistic mock data for offline development.
"""

import sys
from pathlib import Path

# Ensure agent package is in path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from agent.db.connection import db_manager
from agent.db.schema import init_database, seed_mock_data
from agent.db.preferences_repo import PreferencesRepository
from agent.db.audit_repo import AuditRepository
from agent.models import (
    IntentCategory,
    ActionType,
    ParsedIntent,
    RiskTier,
    StepStatus,
    PlanStep,
    ExecutionPlan,
    ApprovalRequest,
    ConstraintType,
    PreferenceScope,
    UserPreference,
)


def print_step(title: str):
    print(f"\n\033[1;34m[TEST]\033[0m {title}...")


def print_success(detail: str):
    print(f"  \033[1;32m✔ PASS:\033[0m {detail}")


def main():
    print("\033[1;36m================================================================")
    print("        PACT AGENTIC AI SUBSYSTEM - PHASE 1 VERIFICATION       ")
    print("================================================================\033[0m")

    # 1. Initialize Real Database
    print_step("Step 1: Initializing Database in database/pact_agent.db")
    init_database(db_manager)
    seed_mock_data(db_manager)
    db_file = db_manager.db_path
    assert db_file.exists(), f"Database file not created at {db_file}"
    print_success(f"Database successfully created at: {db_file} ({db_file.stat().st_size} bytes)")

    # 2. Verify Pydantic Schemas & Sealing
    print_step("Step 2: Testing Pydantic Schemas & Cryptographic Sealing")
    intent = ParsedIntent(
        category=IntentCategory.CROSS_APP,
        action=ActionType.EXECUTE,
        confidence=0.99,
        entities={"person": "Sarah Chen", "deadline": "Friday 12:00 PM"},
        raw_instruction="Find email from Sarah, check deadline in Tasks, and reschedule calendar",
    )
    assert intent.category == IntentCategory.CROSS_APP
    print_success("ParsedIntent validated successfully")

    step = PlanStep(
        step_id="step_reschedule",
        tool_name="reschedule_calendar_event",
        risk_tier=RiskTier.TIER_1_CONSEQUENTIAL,
        parameters={"event_id": "evt_001", "new_start": "2026-10-31 16:30:00"},
    )
    idempotency_key = step.compute_idempotency_key(run_id="run_demo_001")
    assert len(idempotency_key) == 64
    print_success(f"PlanStep idempotency key computed: {idempotency_key[:16]}...")

    approval = ApprovalRequest(
        approval_id="appr_001",
        run_id="run_demo_001",
        step_id="step_reschedule",
        tool_name="reschedule_calendar_event",
        summary="Reschedule Sprint Planning to 4:30 PM",
        payload=step.parameters,
        created_at="2026-10-30T21:00:00Z",
    )
    sealed_hash = approval.seal_payload()
    assert approval.verify_integrity(step.parameters)
    assert not approval.verify_integrity({"tampered": True})
    print_success(f"ApprovalRequest cryptographically sealed: {sealed_hash[:16]}... (tamper-detection verified)")

    # 3. Verify Preferences & Policy Evaluation
    print_step("Step 3: Testing User Preferences & Hard vs. Soft Constraints")
    pref_repo = PreferencesRepository(db_manager)
    active = pref_repo.list_active()
    print_success(f"Retrieved {len(active)} active preference rules from database")

    # Soft constraint check: 9:00 AM (cutoff 10:00 AM)
    allowed_norm, reason_norm, _ = pref_repo.evaluate_calendar_slot(
        "2026-10-31 09:00:00", "2026-10-31 09:30:00", attendee_email="normal.user@acme.corp"
    )
    assert not allowed_norm
    print_success(f"Soft constraint correctly rejected normal contact: '{reason_norm}'")

    allowed_vip, _, _ = pref_repo.evaluate_calendar_slot(
        "2026-10-31 09:00:00", "2026-10-31 09:30:00", attendee_email="sarah.chen@acme.corp"
    )
    assert allowed_vip
    print_success("Soft constraint correctly permitted VIP override for 'sarah.chen@acme.corp'")

    # Hard constraint check: 3:30 PM (child pickup 15:00-16:00)
    allowed_hard, reason_hard, _ = pref_repo.evaluate_calendar_slot(
        "2026-10-31 15:30:00", "2026-10-31 16:00:00", attendee_email="sarah.chen@acme.corp"
    )
    assert not allowed_hard
    print_success(f"Hard constraint strictly rejected VIP contact: '{reason_hard}'")

    # 4. Verify Audit Ledger & Idempotency
    print_step("Step 4: Testing Audit Ledger & Duplicate Prevention")
    audit_repo = AuditRepository(db_manager)
    audit_repo.log_action_start(
        action_id="act_demo_001",
        run_id="run_demo_001",
        step_id="step_reschedule",
        tool_name="reschedule_calendar_event",
        risk_tier=RiskTier.TIER_1_CONSEQUENTIAL,
        parameters=step.parameters,
        payload_hash=sealed_hash,
        idempotency_key=idempotency_key,
    )
    cached = audit_repo.get_by_idempotency_key(idempotency_key)
    assert cached is not None
    assert cached["status"] == StepStatus.EXECUTING.value
    print_success("Action logged with status EXECUTING and locked under idempotency key")

    audit_repo.record_action_result(
        action_id="act_demo_001",
        status=StepStatus.SUCCESS,
        result={"status": "updated", "event_id": "evt_001"},
        is_verified=True,
        verification_details="Confirmed updated start_time in mock_calendar_events",
    )
    final_record = audit_repo.get_by_idempotency_key(idempotency_key)
    assert final_record["is_verified"] is True
    print_success("Action result recorded with is_verified=True and state confirmation")

    print("\n\033[1;32m================================================================")
    print("    PHASE 1 VERIFICATION COMPLETE: ALL SYSTEMS 100% OPERATIONAL ")
    print("================================================================\033[0m\n")


if __name__ == "__main__":
    main()
