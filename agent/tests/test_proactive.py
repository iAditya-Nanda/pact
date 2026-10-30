import tempfile
from pathlib import Path
import pytest
from agent.db.connection import DatabaseManager
from agent.db.schema import init_database, seed_mock_data
from agent.db.alerts_repo import AlertsRepository
from agent.proactive.scanner import ProactiveScanner
from agent.proactive.scheduler import ProactiveScheduler
from agent.models.alerts import ProactiveAlertType, AlertSeverity


@pytest.fixture
def test_proactive():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test_proactive.db"
        manager = DatabaseManager(db_path=db_path)
        init_database(manager)
        seed_mock_data(manager)
        repo = AlertsRepository(manager=manager)
        scanner = ProactiveScanner(manager=manager)
        scheduler = ProactiveScheduler(scanner=scanner, repo=repo)
        yield scanner, repo, scheduler, manager


def test_schedule_conflict_scanner(test_proactive):
    scanner, _, _, manager = test_proactive

    # Insert two overlapping appointments
    with manager.get_connection() as conn:
        conn.execute(
            """
            INSERT INTO mock_calendar_events 
            (event_id, title, start_time, end_time, status)
            VALUES 
            ('evt_overlap_1', 'Team Sync', '2026-10-31 13:00:00', '2026-10-31 14:00:00', 'CONFIRMED'),
            ('evt_overlap_2', 'Client Call', '2026-10-31 13:30:00', '2026-10-31 14:30:00', 'CONFIRMED');
            """
        )

    conflicts = scanner.scan_schedule_conflicts()
    assert len(conflicts) >= 1
    conflict = conflicts[0]
    assert conflict.alert_type == ProactiveAlertType.SCHEDULE_CONFLICT
    assert conflict.severity == AlertSeverity.HIGH
    assert "Team Sync" in conflict.title


def test_preference_violation_scanner(test_proactive):
    scanner, _, _, manager = test_proactive

    # Insert meeting during HARD constraint (child pickup 15:00 - 16:00)
    with manager.get_connection() as conn:
        conn.execute(
            """
            INSERT INTO mock_calendar_events 
            (event_id, title, start_time, end_time, status)
            VALUES 
            ('evt_pickup_violation', 'Vendor Demo', '2026-10-31 15:15:00', '2026-10-31 15:45:00', 'CONFIRMED');
            """
        )

    violations = scanner.scan_preference_violations()
    assert len(violations) >= 1
    violation = violations[0]
    assert violation.alert_type == ProactiveAlertType.PREFERENCE_VIOLATION
    assert violation.severity == AlertSeverity.CRITICAL


def test_tri_vector_deadlock_detection(test_proactive):
    scanner, _, _, _ = test_proactive
    deadlocks = scanner.scan_tri_vector_deadlocks()
    assert len(deadlocks) == 1
    deadlock = deadlocks[0]
    assert deadlock.alert_type == ProactiveAlertType.TRI_VECTOR_DEADLOCK
    assert deadlock.severity == AlertSeverity.CRITICAL
    assert "Finalize Product Release Checklist" in deadlock.title
    assert "sarah.chen@acme.corp" in deadlock.description


def test_proactive_scheduler_sweep_and_repo(test_proactive):
    _, repo, scheduler, _ = test_proactive

    # Run sweep
    alerts = scheduler.run_sweep()
    assert len(alerts) >= 1

    # Check database persistence
    unresolved = repo.list_unresolved()
    assert len(unresolved) == len(alerts)

    # Dismiss one alert
    target_id = unresolved[0].alert_id
    repo.update_status(target_id, "DISMISSED")

    remaining = repo.list_unresolved()
    assert len(remaining) == len(unresolved) - 1
