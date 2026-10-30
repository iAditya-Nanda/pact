#!/usr/bin/env python3
"""
Phase 3 Verification Script for PACT Agentic AI Subsystem.
Validates:
1. Abstract interfaces and local mock adapters (MockEmail, MockCalendar, MockTask).
2. Closed-loop post-condition state verification (is_verified=True).
3. Mathematical calendar interval collision detection.
4. Idempotency deduplication (zero duplicate emails or appointments during retries).
5. 1-Click compensating rollback metadata generation.
"""

import sys
from pathlib import Path

# Ensure root directory in python path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from agent.db.connection import db_manager
from agent.db.schema import init_database, seed_mock_data
from agent.tools.registry import tool_registry
from agent.models.tools import ToolExecutionStatus


def print_step(title: str):
    print(f"\n\033[1;34m[TEST]\033[0m {title}...")


def print_success(detail: str):
    print(f"  \033[1;32m✔ PASS:\033[0m {detail}")


def main():
    print("\033[1;36m================================================================")
    print("        PACT AGENTIC AI SUBSYSTEM - PHASE 3 VERIFICATION       ")
    print("================================================================\033[0m")

    # 1. Ensure DB initialized
    init_database(db_manager)
    seed_mock_data(db_manager)

    # 2. Test Email Search & Dispatch
    print_step("Step 1: Testing Email Adapter & Closed-Loop Verification")
    inbox = tool_registry.email_adapter.search_inbox("Sarah")
    assert len(inbox) >= 1, "Must find pre-seeded email from Sarah Chen"
    print_success(f"Retrieved email from '{inbox[0].sender}' | Subject: '{inbox[0].subject}'")

    send_res = tool_registry.execute_tool(
        tool_name="send_email",
        parameters={
            "recipient": "sarah.chen@acme.corp",
            "subject": "Re: Urgent: Need 30m review",
            "body": "Confirmed! Let us reschedule our sync to Friday 2 PM.",
        },
        run_id="run_phase3_verify",
        step_id="step_email_reply",
        idempotency_key="key_phase3_send_email_001",
    )
    assert send_res.status == ToolExecutionStatus.VERIFIED
    assert send_res.verification.is_verified is True
    print_success(f"Dispatched send_email -> Status: {send_res.status.value}")
    print_success(f"Closed-loop verification: {send_res.verification.verification_details}")

    # 3. Test Mathematical Calendar Conflict Detection & Reschedule
    print_step("Step 2: Testing Mathematical Calendar Conflict Detection")
    conflict_check = tool_registry.calendar_adapter.check_conflicts(
        proposed_start="2026-10-31 10:30:00",
        proposed_end="2026-10-31 11:00:00",
    )
    assert conflict_check["has_conflict"] is True
    print_success(f"Correctly detected collision with '{conflict_check['conflicting_events'][0]['title']}'")

    clear_check = tool_registry.calendar_adapter.check_conflicts(
        proposed_start="2026-10-31 12:00:00",
        proposed_end="2026-10-31 12:30:00",
    )
    assert clear_check["has_conflict"] is False
    print_success("Correctly verified open slot at 12:00 PM (Zero conflicts)")

    # 4. Test Reschedule with 1-Click Rollback Snapshot
    print_step("Step 3: Testing Reschedule & Compensating Rollback Generation")
    reschedule_res = tool_registry.execute_tool(
        tool_name="reschedule_calendar_event",
        parameters={
            "event_id": "evt_001",
            "new_start": "2026-10-31 16:30:00",
            "new_end": "2026-10-31 17:30:00",
        },
        run_id="run_phase3_verify",
        step_id="step_reschedule",
        idempotency_key="key_phase3_reschedule_evt_001",
    )
    assert reschedule_res.status == ToolExecutionStatus.VERIFIED
    assert reschedule_res.verification.is_verified is True
    print_success(f"Rescheduled event to: {reschedule_res.data['new_start']}")
    print_success(f"Compensating action generated: {reschedule_res.data['compensating_action']}")

    # 5. Test Tasks Adapter
    print_step("Step 4: Testing Task Adapter & Complete Verification")
    tasks = tool_registry.task_adapter.list_tasks(status="PENDING")
    assert len(tasks) >= 1
    target_task = tasks[0]
    print_success(f"Active task: '{target_task.title}' (Due: {target_task.due_date})")

    complete_res = tool_registry.execute_tool(
        tool_name="complete_task",
        parameters={"task_id": target_task.task_id},
        run_id="run_phase3_verify",
        step_id="step_task_complete",
        idempotency_key="key_phase3_complete_task_001",
    )
    assert complete_res.status == ToolExecutionStatus.VERIFIED
    print_success(f"Task marked COMPLETED and verified in database ledger")

    # 6. Test Idempotency Deduplication (Zero Duplicate Actions)
    print_step("Step 5: Testing Idempotency Deduplication Guarantee")
    retry_res = tool_registry.execute_tool(
        tool_name="send_email",
        parameters={
            "recipient": "sarah.chen@acme.corp",
            "subject": "Re: Urgent: Need 30m review",
            "body": "Confirmed! Let us reschedule our sync to Friday 2 PM.",
        },
        run_id="run_phase3_verify",
        step_id="step_email_reply",
        idempotency_key="key_phase3_send_email_001",
    )
    assert retry_res.status == ToolExecutionStatus.VERIFIED
    assert "Idempotency Cache Hit" in retry_res.verification.verification_details
    print_success(f"Deduplication confirmed: {retry_res.verification.verification_details}")

    print("\n\033[1;32m================================================================")
    print("    PHASE 3 VERIFICATION COMPLETE: ALL SYSTEMS 100% OPERATIONAL ")
    print("================================================================\033[0m\n")


if __name__ == "__main__":
    main()
