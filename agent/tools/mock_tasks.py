import uuid
from typing import List, Dict, Any, Optional
from agent.db.connection import DatabaseManager, db_manager
from agent.db.schema import sync_sqlite_to_workspace_json
from agent.tools.base import ITaskService, TaskItem


class MockTaskAdapter(ITaskService):
    def __init__(self, manager: DatabaseManager = db_manager):
        self.manager = manager

    def list_tasks(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
    ) -> List[TaskItem]:
        query = "SELECT * FROM mock_tasks WHERE 1=1"
        params = []
        if status:
            query += " AND status = ?"
            params.append(status)
        if priority:
            query += " AND priority = ?"
            params.append(priority)
        query += " ORDER BY due_date ASC;"

        with self.manager.get_connection() as conn:
            rows = conn.execute(query, params).fetchall()
            return [self._row_to_model(r) for r in rows]

    def create_task(
        self,
        title: Optional[str] = None,
        description: Optional[str] = None,
        due_date: Optional[str] = None,
        priority: str = "MEDIUM",
        idempotency_key: str = "",
        **kwargs,
    ) -> TaskItem:
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        t_title = title or kwargs.get("name") or kwargs.get("task_name") or "Follow-up Action"
        d_due = due_date or kwargs.get("due") or "2026-10-31 17:00:00"
        with self.manager.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO mock_tasks 
                (task_id, title, description, due_date, priority, status)
                VALUES (?, ?, ?, ?, ?, 'PENDING');
                """,
                (task_id, t_title, description, d_due, priority),
            )
        sync_sqlite_to_workspace_json(self.manager)
        return TaskItem(
            task_id=task_id,
            title=t_title,
            description=description,
            due_date=d_due,
            priority=priority,
            status="PENDING",
        )

    def complete_task(
        self,
        task_id: Optional[str] = None,
        idempotency_key: str = "",
        **kwargs,
    ) -> Dict[str, Any]:
        tid = task_id or kwargs.get("id") or kwargs.get("title") or "task_001"
        with self.manager.get_connection() as conn:
            existing = conn.execute(
                "SELECT * FROM mock_tasks WHERE task_id = ? OR title LIKE ? LIMIT 1",
                (tid, f"%{tid}%"),
            ).fetchone()
            if existing:
                tid = existing["task_id"]
            conn.execute(
                "UPDATE mock_tasks SET status = 'COMPLETED' WHERE task_id = ?",
                (tid,),
            )
        sync_sqlite_to_workspace_json(self.manager)
        return {
            "task_id": tid,
            "title": existing["title"] if existing else tid,
            "status": "COMPLETED",
            "completed": True,
            # Compensating action to uncomplete / reopen task
            "compensating_action": {
                "tool_name": "reopen_task",
                "parameters": {"task_id": tid},
            },
        }

    def reopen_task(
        self,
        task_id: Optional[str] = None,
        idempotency_key: str = "",
        **kwargs,
    ) -> Dict[str, Any]:
        tid = task_id or kwargs.get("id") or kwargs.get("title") or "task_001"
        with self.manager.get_connection() as conn:
            existing = conn.execute(
                "SELECT * FROM mock_tasks WHERE task_id = ? OR title LIKE ? LIMIT 1",
                (tid, f"%{tid}%"),
            ).fetchone()
            if existing:
                tid = existing["task_id"]
            conn.execute(
                "UPDATE mock_tasks SET status = 'PENDING' WHERE task_id = ?",
                (tid,),
            )
        sync_sqlite_to_workspace_json(self.manager)
        return {"task_id": tid, "status": "PENDING", "completed": False}

    def _row_to_model(self, row) -> TaskItem:
        return TaskItem(
            task_id=row["task_id"],
            title=row["title"],
            description=row["description"],
            due_date=row["due_date"],
            priority=row["priority"],
            status=row["status"],
        )
