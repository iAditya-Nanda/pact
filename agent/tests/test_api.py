import json
import pytest
from fastapi.testclient import TestClient
from agent.api.main import app
from agent.models.approval import ApprovalStatus


@pytest.fixture
def client():
    return TestClient(app)


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert "health_url" in data


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "llama.cpp" in data["llm_engine"]
    assert len(data["active_tools"]) > 0


def test_preferences_crud(client):
    # 1. Create a hard focus preference
    create_payload = {
        "user_id": "api_test_user",
        "scope": "CALENDAR",
        "rule_key": "deep_work_focus_block",
        "description": "Block off 2 PM to 4 PM for uninterrupted coding",
        "constraint_type": "HARD",
        "parameters": {"start_time": "14:00", "end_time": "16:00"},
        "allowed_overrides": [],
        "is_active": True,
    }
    create_res = client.post("/api/preferences", json=create_payload)
    assert create_res.status_code == 200
    created = create_res.json()
    pref_id = created["preference_id"]
    assert created["rule_key"] == "deep_work_focus_block"
    assert created["constraint_type"] == "HARD"

    # 2. List preferences for the user
    list_res = client.get(f"/api/preferences?user_id=api_test_user")
    assert list_res.status_code == 200
    user_prefs = list_res.json()
    assert any(p["preference_id"] == pref_id for p in user_prefs)

    # 3. Delete the preference
    del_res = client.delete(f"/api/preferences/{pref_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "DELETED"

    # 4. Deleting again should return 404
    del_again = client.delete(f"/api/preferences/{pref_id}")
    assert del_again.status_code == 404


def test_alerts_lifecycle(client):
    # 1. Trigger proactive scan
    scan_res = client.post("/api/alerts/scan?user_id=default_user")
    assert scan_res.status_code == 200
    detected_alerts = scan_res.json()
    assert isinstance(detected_alerts, list)

    # 2. Query active unresolved alerts
    get_res = client.get("/api/alerts")
    assert get_res.status_code == 200
    active_alerts = get_res.json()
    assert isinstance(active_alerts, list)

    if active_alerts:
        first_alert = active_alerts[0]
        # 3. Dismiss alert
        dismiss_res = client.post(f"/api/alerts/{first_alert['alert_id']}/dismiss")
        assert dismiss_res.status_code == 200
        assert dismiss_res.json()["status"] == "DISMISSED"


def test_chat_hitl_approval_and_rollback(client):
    # 1. Run an instruction requiring consequential clearance
    chat_res = client.post("/api/chat", json={
        "instruction": "Cancel my 2 PM meeting with Bob",
        "user_id": "default_user",
    })
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert chat_data["status"] == "SUSPENDED_APPROVAL"
    assert chat_data["pending_approval"] is not None

    run_id = chat_data["run_id"]
    payload_hash = chat_data["pending_approval"]["payload_hash"]
    assert payload_hash is not None

    # 2. Test cryptographic tamper rejection (invalid payload_hash)
    tamper_res = client.post("/api/approve", json={
        "run_id": run_id,
        "decision": "APPROVED",
        "payload_hash": "tampered_payload_hash_000000",
    })
    assert tamper_res.status_code == 403
    assert "mismatch" in tamper_res.json()["detail"].lower()

    # 3. Valid clearance
    approve_res = client.post("/api/approve", json={
        "run_id": run_id,
        "decision": "APPROVED",
        "payload_hash": payload_hash,
    })
    assert approve_res.status_code == 200
    approved_data = approve_res.json()
    assert approved_data["status"] in ["COMPLETED", "EXECUTING", "SUSPENDED_APPROVAL"]

    # 4. Compensating rollback
    rollback_res = client.post("/api/rollback", json={"run_id": run_id})
    assert rollback_res.status_code == 200
    rollback_data = rollback_res.json()
    assert rollback_data["status"] == "REVERTED"
    assert rollback_data["run_id"] == run_id


def test_chat_stream_sse(client):
    events_received = []
    with client.stream("POST", "/api/chat/stream", json={"instruction": "Check if I have any meetings today"}) as response:
        assert response.status_code == 200
        for line in response.iter_lines():
            if line.startswith("event:"):
                events_received.append(line.replace("event:", "").strip())

    assert "run_started" in events_received
    assert "intent_extracted" in events_received
    assert "plan_generated" in events_received


def test_global_events_stream(client):
    with client.stream("GET", "/api/events") as response:
        assert response.status_code == 200
        for line in response.iter_lines():
            if line.startswith("event:"):
                assert "connected" in line
                break


def test_error_handling_nonexistent_runs(client):
    import uuid
    random_id = f"non_existent_{uuid.uuid4().hex}"

    # Non-existent run approval
    res_appr = client.post("/api/approve", json={
        "run_id": random_id,
        "decision": "APPROVED",
    })
    assert res_appr.status_code == 404

    # Non-existent run rollback
    res_roll = client.post("/api/rollback", json={
        "run_id": random_id,
    })
    assert res_roll.status_code == 404
