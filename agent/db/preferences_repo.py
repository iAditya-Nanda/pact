import json
from typing import List, Optional, Tuple, Dict, Any
from agent.db.connection import DatabaseManager, db_manager
from agent.models.preferences import UserPreference, ConstraintType, PreferenceScope


class PreferencesRepository:
    def __init__(self, manager: DatabaseManager = db_manager):
        self.manager = manager

    def create_or_update(self, pref: UserPreference) -> UserPreference:
        with self.manager.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO user_preferences 
                (preference_id, user_id, scope, rule_key, description, constraint_type, parameters_json, allowed_overrides_json, is_active, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(preference_id) DO UPDATE SET
                    description = excluded.description,
                    constraint_type = excluded.constraint_type,
                    parameters_json = excluded.parameters_json,
                    allowed_overrides_json = excluded.allowed_overrides_json,
                    is_active = excluded.is_active,
                    updated_at = CURRENT_TIMESTAMP;
                """,
                (
                    pref.preference_id,
                    pref.user_id,
                    pref.scope.value,
                    pref.rule_key,
                    pref.description,
                    pref.constraint_type.value,
                    json.dumps(pref.parameters),
                    json.dumps(pref.allowed_overrides),
                    1 if pref.is_active else 0,
                ),
            )
        return pref

    def get_by_id(self, preference_id: str) -> Optional[UserPreference]:
        with self.manager.get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM user_preferences WHERE preference_id = ?",
                (preference_id,),
            ).fetchone()
            if not row:
                return None
            return self._row_to_model(row)

    def list_active(self, user_id: str = "default_user", scope: Optional[PreferenceScope] = None) -> List[UserPreference]:
        query = "SELECT * FROM user_preferences WHERE user_id = ? AND is_active = 1"
        params = [user_id]
        if scope:
            query += " AND scope = ?"
            params.append(scope.value)

        with self.manager.get_connection() as conn:
            rows = conn.execute(query, params).fetchall()
            return [self._row_to_model(r) for r in rows]

    def delete(self, preference_id: str) -> bool:
        with self.manager.get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM user_preferences WHERE preference_id = ?",
                (preference_id,),
            )
            return cursor.rowcount > 0

    def evaluate_calendar_slot(
        self,
        start_time_str: str,
        end_time_str: str,
        attendee_email: Optional[str] = None,
        user_id: str = "default_user",
    ) -> Tuple[bool, Optional[str], Optional[UserPreference]]:
        """
        Evaluates a proposed calendar slot against active user preferences.
        Returns:
            (is_allowed: bool, violation_reason: Optional[str], violated_preference: Optional[UserPreference])
        """
        active_prefs = self.list_active(user_id=user_id, scope=PreferenceScope.CALENDAR)
        
        # Extract time strings (assumes 'YYYY-MM-DD HH:MM:SS' or 'HH:MM')
        time_part = start_time_str.split(" ")[-1][:5] if " " in start_time_str else start_time_str[:5]

        for pref in active_prefs:
            # Check Rule: no_meetings_before_10am
            if pref.rule_key == "no_meetings_before_10am":
                cutoff = pref.parameters.get("cutoff_time", "10:00")
                if time_part < cutoff:
                    # Check if attendee has soft override permission
                    if pref.constraint_type == ConstraintType.SOFT and attendee_email in pref.allowed_overrides:
                        continue  # Allowed exception for VIP contact
                    return False, f"Violates preference '{pref.description}' (Proposed {time_part} < Cutoff {cutoff})", pref

            # Check Rule: child_pickup_block (Hard constraint)
            if pref.rule_key == "child_pickup_block":
                block_start = pref.parameters.get("start_time", "15:00")
                block_end = pref.parameters.get("end_time", "16:00")
                if block_start <= time_part < block_end:
                    # HARD constraint: absolute veto, even for VIPs
                    return False, f"Violates HARD constraint '{pref.description}' ({block_start}-{block_end})", pref

        return True, None, None

    def _row_to_model(self, row) -> UserPreference:
        return UserPreference(
            preference_id=row["preference_id"],
            user_id=row["user_id"],
            scope=PreferenceScope(row["scope"]),
            rule_key=row["rule_key"],
            description=row["description"],
            constraint_type=ConstraintType(row["constraint_type"]),
            parameters=json.loads(row["parameters_json"]),
            allowed_overrides=json.loads(row["allowed_overrides_json"]),
            is_active=bool(row["is_active"]),
        )
