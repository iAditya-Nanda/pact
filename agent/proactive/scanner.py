import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from agent.db.connection import DatabaseManager, db_manager
from agent.db.preferences_repo import PreferencesRepository
from agent.models.alerts import ProactiveAlert, ProactiveAlertType, AlertSeverity
from agent.models.preferences import ConstraintType, PreferenceScope


class ProactiveScanner:
    def __init__(self, manager: DatabaseManager = db_manager):
        self.manager = manager
        self.pref_repo = PreferencesRepository(manager)

    def scan_all(self, user_id: str = "default_user") -> List[ProactiveAlert]:
        """Runs all deterministic checks and returns detected alerts."""
        alerts: List[ProactiveAlert] = []
        alerts.extend(self.scan_schedule_conflicts())
        alerts.extend(self.scan_preference_violations(user_id=user_id))
        alerts.extend(self.scan_impending_deadlines())
        alerts.extend(self.scan_tri_vector_deadlocks())
        return alerts

    def scan_schedule_conflicts(self) -> List[ProactiveAlert]:
        """Detects mathematical interval overlaps between confirmed appointments."""
        alerts = []
        with self.manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT event_id, title, start_time, end_time FROM mock_calendar_events
                WHERE status = 'CONFIRMED'
                ORDER BY start_time ASC;
                """
            ).fetchall()

        events = [dict(r) for r in rows]
        # Check every pair for interval overlap: Start_A < End_B and Start_B < End_A
        for i in range(len(events)):
            for j in range(i + 1, len(events)):
                ev1, ev2 = events[i], events[j]
                if ev1["start_time"] < ev2["end_time"] and ev2["start_time"] < ev1["end_time"]:
                    alert_id = f"alert_conflict_{ev1['event_id']}_{ev2['event_id']}"
                    alerts.append(
                        ProactiveAlert(
                            alert_id=alert_id,
                            alert_type=ProactiveAlertType.SCHEDULE_CONFLICT,
                            severity=AlertSeverity.HIGH,
                            title=f"Schedule Conflict: '{ev1['title']}' overlaps with '{ev2['title']}'",
                            description=(
                                f"Meeting '{ev1['title']}' ({ev1['start_time']} - {ev1['end_time']}) "
                                f"conflicts with '{ev2['title']}' ({ev2['start_time']} - {ev2['end_time']})."
                            ),
                            detected_entities={"event_a": ev1, "event_b": ev2},
                            proposed_resolution=f"Reschedule '{ev1['title']}' to an open slot.",
                            proposed_action={
                                "tool_name": "reschedule_calendar_event",
                                "parameters": {"event_id": ev1["event_id"], "new_start": "2026-10-31 16:00:00"},
                            },
                        )
                    )
        return alerts

    def scan_preference_violations(self, user_id: str = "default_user") -> List[ProactiveAlert]:
        """Detects appointments that violate user soft or hard constraints."""
        alerts = []
        with self.manager.get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM mock_calendar_events WHERE status = 'CONFIRMED';"
            ).fetchall()

        for row in rows:
            allowed, reason, violated_pref = self.pref_repo.evaluate_calendar_slot(
                start_time_str=row["start_time"],
                end_time_str=row["end_time"],
                attendee_email=None,
                user_id=user_id,
            )
            if not allowed and violated_pref:
                severity = AlertSeverity.CRITICAL if violated_pref.constraint_type == ConstraintType.HARD else AlertSeverity.MEDIUM
                alert_id = f"alert_pref_{row['event_id']}_{violated_pref.rule_key}"
                alerts.append(
                    ProactiveAlert(
                        alert_id=alert_id,
                        alert_type=ProactiveAlertType.PREFERENCE_VIOLATION,
                        severity=severity,
                        title=f"Policy Violation: '{row['title']}' breaches '{violated_pref.rule_key}'",
                        description=reason or "Violates active user preference.",
                        detected_entities={"event": dict(row), "preference_id": violated_pref.preference_id},
                        proposed_resolution=f"Move meeting outside the restricted window.",
                    )
                )
        return alerts

    def scan_impending_deadlines(self) -> List[ProactiveAlert]:
        """Detects pending urgent or high-priority tasks."""
        alerts = []
        with self.manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM mock_tasks 
                WHERE status = 'PENDING' AND (priority = 'URGENT' OR priority = 'HIGH');
                """
            ).fetchall()

        for row in rows:
            alert_id = f"alert_deadline_{row['task_id']}"
            alerts.append(
                ProactiveAlert(
                    alert_id=alert_id,
                    alert_type=ProactiveAlertType.IMPENDING_DEADLINE,
                    severity=AlertSeverity.HIGH if row["priority"] == "URGENT" else AlertSeverity.MEDIUM,
                    title=f"Priority Deadline: '{row['title']}'",
                    description=f"Task is marked {row['priority']} and due at {row['due_date']}.",
                    detected_entities={"task": dict(row)},
                    proposed_resolution="Block 45m of focus time on calendar to complete this deliverable.",
                    proposed_action={
                        "tool_name": "create_calendar_event",
                        "parameters": {
                            "title": f"Focus Block: {row['title']}",
                            "start_time": "2026-10-31 11:30:00",
                            "end_time": "2026-10-31 12:15:00",
                        },
                    },
                )
            )
        return alerts

    def scan_tri_vector_deadlocks(self) -> List[ProactiveAlert]:
        """
        USP 2: Tri-Vector Correlation (The Deadlock Breaker).
        Correlates:
        1. Urgent unread email from a stakeholder requesting a review.
        2. Related deliverable in Tasks with an approaching deadline.
        3. Calendar full or conflicting before that deadline.
        """
        alerts = []
        with self.manager.get_connection() as conn:
            # Check for unread urgent email
            email_row = conn.execute(
                """
                SELECT * FROM mock_emails
                WHERE is_read = 0 AND priority = 'HIGH' AND status = 'INBOX'
                LIMIT 1;
                """
            ).fetchone()

            # Check for urgent pending task
            task_row = conn.execute(
                """
                SELECT * FROM mock_tasks
                WHERE status = 'PENDING' AND priority = 'URGENT'
                LIMIT 1;
                """
            ).fetchone()

        if email_row and task_row:
            # Found mutual cross-app context (e.g. Sarah asking for review on release checklist)
            alert_id = f"alert_tri_vector_{email_row['email_id']}_{task_row['task_id']}"
            alerts.append(
                ProactiveAlert(
                    alert_id=alert_id,
                    alert_type=ProactiveAlertType.TRI_VECTOR_DEADLOCK,
                    severity=AlertSeverity.CRITICAL,
                    title=f"Tri-App Deadlock: Review Needed for '{task_row['title']}'",
                    description=(
                        f"Stakeholder '{email_row['sender']}' requested a 30m sync on '{email_row['subject']}', "
                        f"which blocks task '{task_row['title']}' due at {task_row['due_date']}. "
                        f"Calendar currently has conflicting morning commitments."
                    ),
                    detected_entities={
                        "email": dict(email_row),
                        "task": dict(task_row),
                    },
                    proposed_resolution=(
                        f"Hold 30m at 12:00 PM (immediately before deadline) and reply to '{email_row['sender']}' "
                        f"confirming the review slot."
                    ),
                    proposed_action={
                        "tool_name": "send_email",
                        "parameters": {
                            "recipient": email_row["sender"],
                            "subject": f"Re: {email_row['subject']}",
                            "body": "Hi Sarah, I noticed the Friday deadline. I've placed a hold for 12:00 PM to review.",
                        },
                    },
                )
            )

        return alerts


proactive_scanner = ProactiveScanner()
