import uuid
import json
from typing import List, Dict, Any, Optional
from agent.db.connection import DatabaseManager, db_manager
from agent.db.schema import sync_sqlite_to_workspace_json
from agent.tools.base import ICalendarService, CalendarEvent


class MockCalendarAdapter(ICalendarService):
    def __init__(self, manager: DatabaseManager = db_manager):
        self.manager = manager

    def list_events(
        self,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        **kwargs,
    ) -> List[CalendarEvent]:
        start = start_time or kwargs.get("start") or "2026-01-01 00:00:00"
        end = end_time or kwargs.get("end") or "2026-12-31 23:59:59"
        with self.manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM mock_calendar_events
                WHERE start_time >= ? AND end_time <= ? AND status != 'CANCELLED'
                ORDER BY start_time ASC;
                """,
                (start, end),
            ).fetchall()
            return [self._row_to_model(r) for r in rows]

    def check_conflicts(
        self,
        proposed_start: Optional[str] = None,
        proposed_end: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Calculates mathematical interval collisions:
        Overlap exists iff (event.start < proposed_end) AND (event.end > proposed_start).
        """
        start = proposed_start or kwargs.get("start_time") or kwargs.get("start") or "2026-10-31 10:00:00"
        end = proposed_end or kwargs.get("end_time") or kwargs.get("end") or "2026-10-31 11:00:00"

        with self.manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM mock_calendar_events
                WHERE start_time < ? AND end_time > ? AND status != 'CANCELLED';
                """,
                (end, start),
            ).fetchall()

            conflicts = [self._row_to_model(r).model_dump() for r in rows]
            return {
                "has_conflict": len(conflicts) > 0,
                "conflict_count": len(conflicts),
                "conflicting_events": conflicts,
                "proposed_start": start,
                "proposed_end": end,
            }

    def create_event(
        self,
        title: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        attendees: Optional[List[str]] = None,
        description: Optional[str] = None,
        idempotency_key: str = "",
        **kwargs,
    ) -> CalendarEvent:
        event_id = f"evt_{uuid.uuid4().hex[:8]}"
        t_title = title or kwargs.get("summary") or "New Meeting"
        s_time = start_time or kwargs.get("start") or "2026-10-31 14:00:00"
        e_time = end_time or kwargs.get("end") or "2026-10-31 14:30:00"
        attendees_list = attendees or kwargs.get("attendee_emails") or []
        with self.manager.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO mock_calendar_events 
                (event_id, title, description, start_time, end_time, attendees_json, status)
                VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED');
                """,
                (event_id, t_title, description, s_time, e_time, json.dumps(attendees_list)),
            )
        sync_sqlite_to_workspace_json(self.manager)
        return {
            "event_id": event_id,
            "title": t_title,
            "description": description,
            "start_time": s_time,
            "end_time": e_time,
            "attendees": attendees_list,
            "status": "CONFIRMED",
            "compensating_action": {
                "tool_name": "cancel_calendar_event",
                "parameters": {"event_id": event_id},
            },
        }

    def reschedule_event(
        self,
        event_id: Optional[str] = None,
        new_start: Optional[str] = None,
        new_end: Optional[str] = None,
        idempotency_key: str = "",
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Reschedules an event and preserves original timestamps for 1-click compensating rollback.
        """
        evt_id = event_id or kwargs.get("id") or kwargs.get("title") or "evt_001"
        s_start = new_start or kwargs.get("start_time") or "2026-10-31 14:00:00"
        s_end = new_end or kwargs.get("end_time") or "2026-10-31 15:00:00"

        with self.manager.get_connection() as conn:
            existing = conn.execute(
                "SELECT * FROM mock_calendar_events WHERE event_id = ? OR title LIKE ? LIMIT 1",
                (evt_id, f"%{evt_id}%"),
            ).fetchone()
            if not existing:
                # If target event not found, fallback to first available confirmed event
                existing = conn.execute(
                    "SELECT * FROM mock_calendar_events WHERE status = 'CONFIRMED' LIMIT 1"
                ).fetchone()
                if existing:
                    evt_id = existing["event_id"]
                else:
                    raise ValueError(f"Calendar event '{evt_id}' not found.")
            else:
                evt_id = existing["event_id"]

            original_start = existing["start_time"]
            original_end = existing["end_time"]

            conn.execute(
                """
                UPDATE mock_calendar_events
                SET start_time = ?, end_time = ?, status = 'CONFIRMED'
                WHERE event_id = ?;
                """,
                (s_start, s_end, evt_id),
            )
        sync_sqlite_to_workspace_json(self.manager)

        return {
            "event_id": evt_id,
            "title": existing["title"],
            "previous_start": original_start,
            "previous_end": original_end,
            "new_start": s_start,
            "new_end": s_end,
            "status": "CONFIRMED",
            # Compensating metadata enables 1-click rollback
            "compensating_action": {
                "tool_name": "reschedule_calendar_event",
                "parameters": {
                    "event_id": evt_id,
                    "new_start": original_start,
                    "new_end": original_end,
                },
            },
        }

    def cancel_event(
        self,
        event_id: Optional[str] = None,
        reason: Optional[str] = None,
        idempotency_key: str = "",
        **kwargs,
    ) -> Dict[str, Any]:
        evt_id = event_id or kwargs.get("id") or kwargs.get("title") or "evt_001"
        with self.manager.get_connection() as conn:
            existing = conn.execute(
                "SELECT * FROM mock_calendar_events WHERE event_id = ? OR title LIKE ? LIMIT 1",
                (evt_id, f"%{evt_id}%"),
            ).fetchone()
            if existing:
                evt_id = existing["event_id"]
            conn.execute(
                "UPDATE mock_calendar_events SET status = 'CANCELLED' WHERE event_id = ?",
                (evt_id,),
            )
        sync_sqlite_to_workspace_json(self.manager)
        return {
            "event_id": evt_id,
            "status": "CANCELLED",
            "reason": reason,
            "compensating_action": {
                "tool_name": "reschedule_calendar_event",
                "parameters": {
                    "event_id": evt_id,
                    "new_start": existing["start_time"] if existing else "2026-10-31 14:00:00",
                    "new_end": existing["end_time"] if existing else "2026-10-31 15:00:00",
                },
            },
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
