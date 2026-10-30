import uuid
from typing import List, Dict, Any, Optional
from agent.db.connection import DatabaseManager, db_manager
from agent.tools.base import IEmailService, EmailMessage


class MockEmailAdapter(IEmailService):
    def __init__(self, manager: DatabaseManager = db_manager):
        self.manager = manager

    def search_inbox(self, query: str = "", limit: int = 10, **kwargs) -> List[EmailMessage]:
        search_term = query or kwargs.get("q") or kwargs.get("sender") or ""
        like_query = f"%{search_term}%"
        with self.manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM mock_emails
                WHERE (subject LIKE ? OR body LIKE ? OR sender LIKE ?)
                ORDER BY received_at DESC
                LIMIT ?;
                """,
                (like_query, like_query, like_query, limit),
            ).fetchall()
            return [self._row_to_model(r) for r in rows]

    def read_email(self, email_id: str = "email_001", **kwargs) -> Optional[EmailMessage]:
        eid = email_id or kwargs.get("id") or "email_001"
        with self.manager.get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM mock_emails WHERE email_id = ?",
                (eid,),
            ).fetchone()
            if not row:
                return None
            conn.execute("UPDATE mock_emails SET is_read = 1 WHERE email_id = ?", (eid,))
            return self._row_to_model(row)

    def create_draft(
        self,
        recipient: Optional[str] = None,
        subject: Optional[str] = None,
        body: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        draft_id = f"draft_{uuid.uuid4().hex[:8]}"
        rcpt = recipient or kwargs.get("to") or "sarah.chen@acme.corp"
        sbj = subject or kwargs.get("title") or "Meeting Followup"
        bdy = body or kwargs.get("content") or "Confirming our sync."
        with self.manager.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO mock_emails 
                (email_id, sender, recipient, subject, body, priority, is_read, status)
                VALUES (?, ?, ?, ?, ?, 'NORMAL', 1, 'DRAFT');
                """,
                (draft_id, "user@acme.corp", rcpt, sbj, bdy),
            )
        return {
            "draft_id": draft_id,
            "recipient": rcpt,
            "subject": sbj,
            "status": "DRAFT",
        }

    def send_email(
        self,
        recipient: Optional[str] = None,
        subject: Optional[str] = None,
        body: Optional[str] = None,
        draft_id: Optional[str] = None,
        idempotency_key: str = "",
        **kwargs,
    ) -> Dict[str, Any]:
        email_id = draft_id or f"email_{uuid.uuid4().hex[:8]}"
        rcpt = recipient or kwargs.get("to") or "sarah.chen@acme.corp"
        sbj = subject or kwargs.get("title") or "Meeting Followup"
        bdy = body or kwargs.get("content") or "Confirming our sync."
        with self.manager.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO mock_emails 
                (email_id, sender, recipient, subject, body, priority, is_read, status)
                VALUES (?, ?, ?, ?, ?, 'HIGH', 1, 'SENT')
                ON CONFLICT(email_id) DO UPDATE SET
                    status = 'SENT',
                    recipient = excluded.recipient,
                    subject = excluded.subject,
                    body = excluded.body;
                """,
                (email_id, "user@acme.corp", rcpt, sbj, bdy),
            )
        return {
            "message_id": email_id,
            "recipient": rcpt,
            "subject": sbj,
            "status": "SENT",
            "delivered": True,
        }

    def _row_to_model(self, row) -> EmailMessage:
        return EmailMessage(
            email_id=row["email_id"],
            sender=row["sender"],
            recipient=row["recipient"],
            subject=row["subject"],
            body=row["body"],
            priority=row["priority"],
            is_read=bool(row["is_read"]),
            status=row["status"],
            received_at=row["received_at"] or "",
        )
