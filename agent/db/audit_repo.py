import json
from typing import Dict, Any, Optional, List
from agent.db.connection import DatabaseManager, db_manager
from agent.models.plan import RiskTier, StepStatus


class AuditRepository:
    def __init__(self, manager: DatabaseManager = db_manager):
        self.manager = manager

    def get_by_idempotency_key(self, idempotency_key: str) -> Optional[Dict[str, Any]]:
        """Look up an action by its deterministic idempotency key to prevent duplicate execution."""
        with self.manager.get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM agent_actions WHERE idempotency_key = ?",
                (idempotency_key,),
            ).fetchone()
            if not row:
                return None
            return self._row_to_dict(row)

    def log_action_start(
        self,
        action_id: str,
        run_id: str,
        step_id: str,
        tool_name: str,
        risk_tier: RiskTier,
        parameters: Dict[str, Any],
        payload_hash: str,
        idempotency_key: str,
    ) -> None:
        """Record the initiation of an agent action."""
        with self.manager.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO agent_actions 
                (action_id, run_id, step_id, tool_name, risk_tier, status, parameters_json, payload_hash, idempotency_key)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(idempotency_key) DO UPDATE SET
                    status = excluded.status,
                    updated_at = CURRENT_TIMESTAMP;
                """,
                (
                    action_id,
                    run_id,
                    step_id,
                    tool_name,
                    risk_tier.value,
                    StepStatus.EXECUTING.value,
                    json.dumps(parameters, sort_keys=True),
                    payload_hash,
                    idempotency_key,
                ),
            )

    def record_action_result(
        self,
        action_id: str,
        status: StepStatus,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        is_verified: bool = False,
        verification_details: Optional[str] = None,
    ) -> None:
        """Record the terminal result and verification state of an action."""
        with self.manager.get_connection() as conn:
            conn.execute(
                """
                UPDATE agent_actions
                SET status = ?,
                    result_json = ?,
                    error_message = ?,
                    is_verified = ?,
                    verification_details = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE action_id = ?;
                """,
                (
                    status.value,
                    json.dumps(result) if result is not None else None,
                    error,
                    1 if is_verified else 0,
                    verification_details,
                    action_id,
                ),
            )

    def get_run_history(self, run_id: str) -> List[Dict[str, Any]]:
        """Retrieve full chronological audit trail for a specific run."""
        with self.manager.get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM agent_actions WHERE run_id = ? ORDER BY created_at ASC",
                (run_id,),
            ).fetchall()
            return [self._row_to_dict(r) for r in rows]

    def _row_to_dict(self, row) -> Dict[str, Any]:
        return {
            "action_id": row["action_id"],
            "run_id": row["run_id"],
            "step_id": row["step_id"],
            "tool_name": row["tool_name"],
            "risk_tier": row["risk_tier"],
            "status": row["status"],
            "parameters": json.loads(row["parameters_json"]),
            "payload_hash": row["payload_hash"],
            "idempotency_key": row["idempotency_key"],
            "result": json.loads(row["result_json"]) if row["result_json"] else None,
            "error_message": row["error_message"],
            "is_verified": bool(row["is_verified"]),
            "verification_details": row["verification_details"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
