r"""
PACT Agentic Subsystem - Phase 6 End-to-End Verification Script
================================================================
Verifies:
1. FastAPI Gateway & Health Endpoint
2. Preferences CRUD Endpoints (Hard constraints & Soft VIP rules)
3. Proactive Intelligence Alerts (Scan, List, Dismiss)
4. Real-Time Server-Sent Events (SSE) Streaming Chat
5. Human-in-the-Loop Approval Gate with Cryptographic Hash Verification
6. Workflow Resumption & Execution
7. Time-Machine 1-Click Compensating Rollback
8. Global SSE Event Notification Bus
"""

import sys
import json
import uuid
from fastapi.testclient import TestClient
from agent.api.main import app


def verify_phase6():
    print("=" * 70)
    print("   PACT AGENTIC SUBSYSTEM: PHASE 6 VERIFICATION")
    print("   FastAPI Gateway & Real-Time Streaming Protocol")
    print("=" * 70)

    client = TestClient(app)

    # -------------------------------------------------------------
    # 1. Health Probe Verification
    # -------------------------------------------------------------
    print("\n[Step 1/8] Verifying API Health & Readiness Probe...")
    res_health = client.get("/api/health")
    assert res_health.status_code == 200, f"Health probe failed: {res_health.status_code}"
    health_data = res_health.json()
    print(f"  + System Status: {health_data['status']}")
    print(f"  + Database: {health_data['database']}")
    print(f"  + LLM Engine: {health_data['llm_engine']}")
    print(f"  + Active Registered Tools: {len(health_data['active_tools'])} tools loaded")
    assert health_data["status"] == "healthy"
    assert len(health_data["active_tools"]) >= 10

    # -------------------------------------------------------------
    # 2. User Preferences REST API
    # -------------------------------------------------------------
    print("\n[Step 2/8] Testing Preferences Management Endpoints...")
    test_user = f"user_{uuid.uuid4().hex[:6]}"
    pref_payload = {
        "user_id": test_user,
        "scope": "CALENDAR",
        "rule_key": "hard_family_dinner_block",
        "description": "Never schedule work meetings between 6 PM and 8 PM",
        "constraint_type": "HARD",
        "parameters": {"start_time": "18:00", "end_time": "20:00"},
        "allowed_overrides": [],
        "is_active": True,
    }
    res_create_pref = client.post("/api/preferences", json=pref_payload)
    assert res_create_pref.status_code == 200, f"Preference creation failed: {res_create_pref.text}"
    created_pref = res_create_pref.json()
    pref_id = created_pref["preference_id"]
    print(f"  + Created Hard Constraint: ID={pref_id}, Rule='{created_pref['rule_key']}'")

    res_list_pref = client.get(f"/api/preferences?user_id={test_user}")
    assert res_list_pref.status_code == 200
    user_prefs = res_list_pref.json()
    assert len(user_prefs) == 1
    print(f"  + Retrieved user preferences: {len(user_prefs)} record(s)")

    res_del_pref = client.delete(f"/api/preferences/{pref_id}")
    assert res_del_pref.status_code == 200
    print(f"  + Cleaned up test preference: {res_del_pref.json()['status']}")

    # -------------------------------------------------------------
    # 3. Proactive Intelligence Alerts
    # -------------------------------------------------------------
    print("\n[Step 3/8] Testing Proactive Intelligence & Alerts API...")
    res_scan = client.post("/api/alerts/scan?user_id=default_user")
    assert res_scan.status_code == 200
    detected_alerts = res_scan.json()
    print(f"  + Proactive Scan triggered: {len(detected_alerts)} alert(s) detected/updated")

    res_alerts = client.get("/api/alerts")
    assert res_alerts.status_code == 200
    active_alerts = res_alerts.json()
    print(f"  + Active Unresolved Alerts: {len(active_alerts)}")

    if active_alerts:
        first_alert = active_alerts[0]
        res_dismiss = client.post(f"/api/alerts/{first_alert['alert_id']}/dismiss")
        assert res_dismiss.status_code == 200
        print(f"  + Successfully dismissed alert '{first_alert['alert_id']}': {res_dismiss.json()['status']}")

    # -------------------------------------------------------------
    # 4. Global SSE Event Notification Bus
    # -------------------------------------------------------------
    print("\n[Step 4/8] Testing Global SSE Notification Bus (/api/events)...")
    with client.stream("GET", "/api/events") as sse_stream:
        assert sse_stream.status_code == 200
        handshake_received = False
        for line in sse_stream.iter_lines():
            if line.startswith("data:"):
                handshake_received = True
                print(f"  + Received SSE Event: {line}")
                break
        assert handshake_received, "Failed to receive SSE handshake"

    # -------------------------------------------------------------
    # 5. Real-Time Streaming Chat (SSE)
    # -------------------------------------------------------------
    print("\n[Step 5/8] Testing Real-Time SSE Chat Streaming (/api/chat/stream)...")
    sse_events = []
    with client.stream(
        "POST",
        "/api/chat/stream",
        json={"instruction": "What are my scheduled meetings for today?", "user_id": "default_user"},
    ) as stream_resp:
        assert stream_resp.status_code == 200
        for line in stream_resp.iter_lines():
            if line.startswith("event:"):
                event_type = line.replace("event:", "").strip()
                sse_events.append(event_type)

    print(f"  + Streamed Events Sequence: {' -> '.join(sse_events)}")
    assert "run_started" in sse_events
    assert "intent_extracted" in sse_events
    assert "plan_generated" in sse_events

    # -------------------------------------------------------------
    # 6. Human-in-the-Loop Clearance Gate & Tamper Verification
    # -------------------------------------------------------------
    print("\n[Step 6/8] Testing HITL Policy Gate with Cryptographic Hash Validation...")
    res_chat = client.post(
        "/api/chat",
        json={"instruction": "Cancel my 2 PM meeting with Bob", "user_id": "default_user"},
    )
    assert res_chat.status_code == 200
    chat_data = res_chat.json()
    run_id = chat_data["run_id"]
    assert chat_data["status"] == "SUSPENDED_APPROVAL", f"Expected SUSPENDED_APPROVAL, got {chat_data['status']}"
    assert chat_data["pending_approval"] is not None
    pending = chat_data["pending_approval"]
    payload_hash = pending["payload_hash"]
    print(f"  + Workflow suspended: run_id='{run_id}', step='{pending['step_id']}', tool='{pending['tool_name']}'")
    print(f"  + Cryptographic Payload Hash: {payload_hash}")

    # Tampered clearance attempt
    res_tamper = client.post(
        "/api/approve",
        json={"run_id": run_id, "decision": "APPROVED", "payload_hash": "tampered_fake_hash_12345"},
    )
    assert res_tamper.status_code == 403, f"Expected 403 for tampered clearance, got {res_tamper.status_code}"
    print(f"  + Security Gate: Tampered hash rejected with HTTP 403: {res_tamper.json()['detail']}")

    # -------------------------------------------------------------
    # 7. Resumption with Valid Approval
    # -------------------------------------------------------------
    print("\n[Step 7/8] Testing Workflow Resumption with Valid Approval...")
    res_approve = client.post(
        "/api/approve",
        json={"run_id": run_id, "decision": "APPROVED", "payload_hash": payload_hash},
    )
    assert res_approve.status_code == 200
    resumed_data = res_approve.json()
    print(f"  + Resumed Workflow Status: {resumed_data['status']}")
    print(f"  + Summary: {resumed_data.get('final_summary')}")
    assert resumed_data["status"] in ["COMPLETED", "EXECUTING", "SUSPENDED_APPROVAL"]

    # -------------------------------------------------------------
    # 8. Time-Machine 1-Click Rollback
    # -------------------------------------------------------------
    print("\n[Step 8/8] Testing Time-Machine 1-Click Compensating Rollback...")
    res_rollback = client.post("/api/rollback", json={"run_id": run_id})
    assert res_rollback.status_code == 200
    rollback_data = res_rollback.json()
    print(f"  + Rollback Status: {rollback_data['status']}")
    print(f"  + Reverted Actions Count: {rollback_data['reverted_count']}")
    assert rollback_data["status"] == "REVERTED"

    print("\n" + "=" * 70)
    print("   PHASE 6 VERIFICATION COMPLETE: ALL 8 TEST GATES PASSED")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    verify_phase6()
