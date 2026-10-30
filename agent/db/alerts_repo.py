import json
from typing import List, Optional
from agent.db.connection import DatabaseManager, db_manager
from agent.models.alerts import ProactiveAlert, ProactiveAlertType, AlertSeverity


class AlertsRepository:
    def __init__(self, manager: DatabaseManager = db_manager):
        self.manager = manager

    def create_alert(self, alert: ProactiveAlert) -> ProactiveAlert:
        """Stores a proactive alert in the database."""
        with self.manager.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO proactive_alerts
                (alert_id, alert_type, title, description, proposed_plan_json, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(alert_id) DO UPDATE SET
                    title = excluded.title,
                    description = excluded.description,
                    proposed_plan_json = excluded.proposed_plan_json,
                    status = excluded.status;
                """,
                (
                    alert.alert_id,
                    alert.alert_type.value,
                    alert.title,
                    alert.description,
                    json.dumps({
                        "severity": alert.severity.value,
                        "detected_entities": alert.detected_entities,
                        "proposed_resolution": alert.proposed_resolution,
                        "proposed_action": alert.proposed_action,
                    }),
                    alert.status,
                ),
            )
        return alert

    def list_unresolved(self) -> List[ProactiveAlert]:
        """Lists all active unresolved alerts."""
        with self.manager.get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM proactive_alerts WHERE status = 'UNRESOLVED' ORDER BY created_at DESC;"
            ).fetchall()
            return [self._row_to_model(r) for r in rows]

    def update_status(self, alert_id: str, status: str) -> bool:
        with self.manager.get_connection() as conn:
            cursor = conn.execute(
                "UPDATE proactive_alerts SET status = ? WHERE alert_id = ?;",
                (status, alert_id),
            )
            return cursor.rowcount > 0

    def _row_to_model(self, row) -> ProactiveAlert:
        plan_meta = {}
        if row["proposed_plan_json"]:
            try:
                plan_meta = json.loads(row["proposed_plan_json"])
            except Exception:
                plan_meta = {}

        return ProactiveAlert(
            alert_id=row["alert_id"],
            alert_type=ProactiveAlertType(row["alert_type"]),
            severity=AlertSeverity(plan_meta.get("severity", AlertSeverity.MEDIUM.value)),
            title=row["title"],
            description=row["description"],
            detected_entities=plan_meta.get("detected_entities", {}),
            proposed_resolution=plan_meta.get("proposed_resolution"),
            proposed_action=plan_meta.get("proposed_action"),
            status=row["status"],
            created_at=row["created_at"] or "",
        )


alerts_repo = AlertsRepository()
