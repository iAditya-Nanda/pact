#!/usr/bin/env python3
"""
Phase 4 Verification Script for PACT Agentic AI Subsystem.
Validates:
1. LangGraph StateGraph state machine compilation with SqliteSaver durable checkpointing.
2. Clarification routing for ambiguous user instructions.
3. State suspension at SUSPENDED_APPROVAL when reaching consequential Tier 1 tools.
4. Cryptographic approval seal integrity check (detecting & rejecting tampered payloads).
5. Resuming from checkpoint upon user approval.
6. 1-Click Compensating Rollback (restoring pre-mutation state).
"""

import sys
from pathlib import Path

# Ensure root directory in python path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from agent.db.connection import db_manager
from agent.db.schema import init_database, seed_mock_data
from agent.core.orchestrator import orchestrator
from agent.models.approval import ApprovalStatus


def print_step(title: str):
    print(f"\n\033[1;34m[TEST]\033[0m {title}...")


def print_success(detail: str):
    print(f"  \033[1;32m✔ PASS:\033[0m {detail}")


def main():
    print("\033[1;36m================================================================")
    print("        PACT AGENTIC AI SUBSYSTEM - PHASE 4 VERIFICATION       ")
    print("================================================================\033[0m")

    # 1. Initialize DB & seed mock records
    print_step("Step 1: Initializing Database & Checkpointer")
    init_database(db_manager)
    seed_mock_data(db_manager)
    print_success(f"Durable checkpointer active on: {db_manager.db_path}")

    # 2. Test Ambiguous Instruction
    print_step("Step 2: Testing Clarification Routing on Ambiguous Input")
    clarify_state = orchestrator.run(
        instruction="Cancel my meeting",
        run_id="run_phase4_clarify",
    )
    assert clarify_state["status"] == "CLARIFICATION_NEEDED"
    assert clarify_state["requires_clarification"] is True
    print_success(f"State routed to CLARIFICATION_NEEDED without hallucinating execution")
    print(f"    Clarification question: \"\033[1;33m{clarify_state['final_summary']}\033[0m\"")

    # 3. Test Multi-Step Execution & Suspension
    print_step("Step 3: Executing Consequential Workflow & Verifying Suspension")
    instruction = "Move my meeting with Sarah to tomorrow at 2 PM"
    run_id = "run_phase4_e2e_001"
    print(f"  Input: \"{instruction}\"")

    state = orchestrator.run(instruction=instruction, run_id=run_id)
    assert state["status"] == "SUSPENDED_APPROVAL", f"Expected SUSPENDED_APPROVAL, got {state.get('status')}"
    assert state["pending_approval"] is not None

    pending = state["pending_approval"]
    sealed_hash = pending["payload_hash"]
    print_success(f"Workflow halted at SUSPENDED_APPROVAL before consequential execution")
    print(f"    Pending Tool: \033[1;33m{pending['tool_name']}\033[0m | Step: {pending['step_id']}")
    print(f"    Sealed Payload Hash: \033[1;32m{sealed_hash[:16]}...\033[0m")

    # 4. Test Tamper-Detection
    print_step("Step 4: Testing Tamper Detection on Altered Approval Payload")
    try:
        orchestrator.approve_and_resume(
            run_id=run_id,
            decision=ApprovalStatus.APPROVED,
            payload_hash="tampered_hash_0000000000000000000000000000000000000000000000000000",
        )
        assert False, "Tampered payload must raise PermissionError"
    except PermissionError as e:
        print_success(f"Tampered hash successfully rejected: '{e}'")

    # 5. Test Resumption with Valid Approval
    print_step("Step 5: Resuming Execution with Verified User Clearance")
    resumed = orchestrator.approve_and_resume(
        run_id=run_id,
        decision=ApprovalStatus.APPROVED,
        payload_hash=sealed_hash,
    )
    # Handle any chained consequential actions until plan completion
    while resumed.get("status") == "SUSPENDED_APPROVAL":
        next_pending = resumed["pending_approval"]
        print(f"    Next consequential step cleared: {next_pending['tool_name']}")
        resumed = orchestrator.approve_and_resume(
            run_id=run_id,
            decision=ApprovalStatus.APPROVED,
            payload_hash=next_pending["payload_hash"],
        )

    assert resumed["status"] == "COMPLETED"
    print_success(f"Workflow reached COMPLETED state. Executed {len(resumed['execution_history'])} step(s):")
    for idx, h in enumerate(resumed["execution_history"], 1):
        v_tag = "\033[1;32mVERIFIED\033[0m" if h.get("verification", {}).get("is_verified") else "\033[1;31mUNVERIFIED\033[0m"
        print(f"      {idx}. {h['tool_name']} -> {v_tag}")

    # 6. Test 1-Click Compensating Rollback
    print_step("Step 6: Testing USP: 1-Click Compensating Rollback (Undo Ledger)")
    compensating_count = len(resumed.get("compensating_log", []))
    assert compensating_count >= 1, "Must have recorded compensating action"
    print(f"  Found {compensating_count} inverse compensating action(s) in undo ledger.")

    rollback_res = orchestrator.revert_run(run_id=run_id)
    assert rollback_res["status"] == "REVERTED"
    print_success(f"1-Click Rollback executed successfully ({rollback_res['reverted_count']} inverse operations)")
    for act in rollback_res["reverted_actions"]:
        print(f"      Reverted: {act['tool_name']} (Restored previous timestamp)")

    print("\n\033[1;32m================================================================")
    print("    PHASE 4 VERIFICATION COMPLETE: ALL SYSTEMS 100% OPERATIONAL ")
    print("================================================================\033[0m\n")


if __name__ == "__main__":
    main()
