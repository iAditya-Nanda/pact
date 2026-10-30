import uuid
import json
from typing import List, Dict, Any, Optional
from agent.db.connection import DatabaseManager, db_manager
from agent.tools.base import ICalendarService, CalendarEvent


class MockCalendarAdapter(ICalendarService):
    def __init__(self, manager: DatabaseManager = db_manager):
        self.manager = manager

    def list_events(self, start_time: str, end_time: str) -> List[CalendarEvent]:
        with self.manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM mock_calendar_events
                WHERE start_time >= ? AND end_time <= ? AND status != 'CANCELLED'
                ORDER BY start_time ASC;
                """,
                (start_time, end_time),
            ).fetchall()
            return [self._row_to_model(r) for r in rows]

    def check_conflicts(self, proposed_start: str, proposed_end: str) -> Dict[str, Any]:
        """
        Calculates mathematical interval collisions:
        Overlap exists iff (event.start < proposed_end) AND (event.end > proposed_start).
        """
        with self.manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM mock_calendar_events
                WHERE start_time < ? AND end_time > ? AND status != 'CANCELLED';
                """,
                (proposed_end, proposed_start),
            ).fetchall()

            conflicts = [self._row_to_model(r).model_dump() for r in rows]
            return {
                "has_conflict": len(conflicts) > 0,
                "conflict_count": len(conflicts),
                "conflicting_events": conflicts,
                "proposed_start": proposed_start,
                "proposed_end": proposed_end,
            }

    def create_event(
        self,
        title: str,
        start_time: str,
        end_time: str,
        attendees: Optional[List[str]] = None,
        description: Optional[str] = None,
        idempotency_key: str = "",
    ) -> CalendarEvent:
        event_id = f"evt_{uuid.uuid4().hex[:8]}"
        attendees_list = attendees or []
        with self.manager.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO mock_calendar_events 
                (event_id, title, description, start_time, end_time, attendees_json, status)
                VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED');
                """,
                (event_id, title, description, start_time, end_time, json.dumps(attendees_list)),
            )
        return CalendarEvent(
            event_id=event_id,
            title=title,
            description=description,
            start_time=start_time,
            end_time=end_time,
            attendees=attendees_list,
            status="CONFIRMED",
        )

    def reschedule_event(
        self,
        event_id: str,
        new_start: str,
        new_end: str,
        idempotency_key: str = "",
    ) -> Dict[str, Any]:
        """
        Reschedules an event and preserves original timestamps for 1-click compensating rollback.
        """
        with self.manager.get_connection() as conn:
            existing = conn.execute(
                "SELECT * FROM mock_calendar_events WHERE event_id = ?",
                (event_id,),
            ).fetchone()
            if not existing:
                raise ValueError(f"Calendar event '{event_id}' not found.")

            original_start = existing["start_time"]
            original_end = existing["end_time"]

            conn.execute(
                """
                UPDATE mock_calendar_events
                SET start_time = ?, end_time = ?, status = 'CONFIRMED'
                WHERE event_id = ?;
                """,
                (new_start, new_end, event_id),
            )

        return {
            "event_id": event_id,
            "title": existing["title"],
            "previous_start": original_start,
            "previous_end": original_end,
            "new_start": new_start,
            "new_end": new_end,
            "status": "CONFIRMED",
            # Compensating metadata enables 1-click rollback
            "compensating_action": {
                "tool_name": "reschedule_calendar_event",
                "parameters": {
                    "event_id": event_id,
                    "new_start": original_start,
                    "new_end": original_end,
                },
            },
        }

    def cancel_event(
        self,
        event_id: str,
        reason: Optional[str] = None,
        idempotency_key: str = "",
    ) -> Dict[str, Any]:
        with self.manager.get_connection() as conn:
            conn.execute(
                "UPDATE mock_calendar_events SET status = 'CANCELLED' WHERE event_id = ?",
                (event_id,),
            )
        return {
            "event_id": event_id,
            "status": "CANCELLED",
            "reason": reason,
        }

    def _row_to_model(self, row) -> CalendarEvent:
        attendees = []
        if row["attendees_json"]:
            try:
                attendees = json.loads(row["attendees_json"])
            except Exception:
                attendees = []
        return CalendarEvent(
            event_id=row["event_id"],
            title=row["title"],
            description=row["description"],
            start_time=row["start_time"],
            end_time=row["end_time"],
            attendees=attendees,
            status=row["status"],
        )
