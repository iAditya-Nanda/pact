import re
import uuid
import json
from enum import Enum
from typing import List, Optional, Tuple
from pydantic import BaseModel, Field
from agent.db.connection import DatabaseManager, db_manager


class ThreatCategory(str, Enum):
    PROMPT_INJECTION = "PROMPT_INJECTION"
    JAILBREAK_ATTEMPT = "JAILBREAK_ATTEMPT"
    SYSTEM_OVERRIDE = "SYSTEM_OVERRIDE"
    CLEARANCE_BYPASS = "CLEARANCE_BYPASS"
    DATA_EXFILTRATION = "DATA_EXFILTRATION"


class SecurityCheckResult(BaseModel):
    is_safe: bool
    threat_category: Optional[ThreatCategory] = None
    risk_score: float = Field(ge=0.0, le=1.0)
    matched_patterns: List[str] = Field(default_factory=list)
    sanitized_instruction: str
    reason: Optional[str] = None


class SecuritySanitizer:
    # High-severity injection signatures
    INJECTION_SIGNATURES = [
        (r"ignore\s+(all\s+)?(previous|prior|above|safety)?\s*(instructions|prompts|rules|constraints)", ThreatCategory.PROMPT_INJECTION, 0.95),
        (r"(system|admin|root|superuser)\s+override", ThreatCategory.SYSTEM_OVERRIDE, 0.90),
        (r"(bypass|disable|skip|ignore)\s+(all\s+)?(clearance|approval|confirmation|human\s+check)", ThreatCategory.CLEARANCE_BYPASS, 0.95),
        (r"(you\s+are\s+now\s+dan|dan\s+mode|\bjailbreak\b|developer\s+mode)", ThreatCategory.JAILBREAK_ATTEMPT, 0.95),
        (r"(output|print|reveal|display|leak)\s+(your\s+)?(system\s+prompt|initial\s+prompt|hidden\s+instructions)", ThreatCategory.PROMPT_INJECTION, 0.85),
        (r"(exfiltrate|send|forward|upload)\b.*?\b(data|passwords|tokens|keys|emails|credentials|contacts)\b.*?\bto\s+https?://", ThreatCategory.DATA_EXFILTRATION, 0.98),
        (r"\b(curl|wget|nc|rm\s+-rf)\b|bash\s+-i|/bin/sh", ThreatCategory.SYSTEM_OVERRIDE, 0.95),
        (r"disregard\s+(all\s+)?(safety\s+|hard\s+)?(constraints|user\s+preferences|security\s+rules|rules)", ThreatCategory.CLEARANCE_BYPASS, 0.92),
        (r"(---\s*(end|start)\s+of\s+(instructions|prompt|system)|\bnow\s+do\s+anything\b)", ThreatCategory.PROMPT_INJECTION, 0.95),
    ]

    def __init__(self, manager: DatabaseManager = db_manager):
        self.manager = manager

    def analyze_instruction(self, instruction: str, user_id: str = "default_user") -> SecurityCheckResult:
        """
        Inspects raw user instructions against prompt injection, jailbreak attempts,
        and unauthorized clearance bypasses before passing to the reasoning engine.
        """
        cleaned = instruction.strip()
        matched = []
        max_risk = 0.0
        primary_threat = None

        for pattern, threat, risk in self.INJECTION_SIGNATURES:
            if re.search(pattern, cleaned, re.IGNORECASE):
                matched.append(pattern)
                if risk > max_risk:
                    max_risk = risk
                    primary_threat = threat

        if matched:
            reason = f"Security threat detected: {primary_threat.value} matching patterns: {matched}"
            self._log_security_event(
                event_type=primary_threat.value,
                severity="CRITICAL" if max_risk >= 0.9 else "HIGH",
                user_id=user_id,
                instruction=cleaned,
                reason=reason,
                details={"matched_patterns": matched, "risk_score": max_risk},
            )

            return SecurityCheckResult(
                is_safe=False,
                threat_category=primary_threat,
                risk_score=max_risk,
                matched_patterns=matched,
                sanitized_instruction=cleaned,
                reason=reason,
            )

        # Basic input sanitization (strip null bytes, excessive unprintable control characters)
        sanitized = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", cleaned)

        return SecurityCheckResult(
            is_safe=True,
            threat_category=None,
            risk_score=0.0,
            matched_patterns=[],
            sanitized_instruction=sanitized,
            reason=None,
        )

    def _log_security_event(
        self,
        event_type: str,
        severity: str,
        user_id: str,
        instruction: str,
        reason: str,
        details: dict,
    ) -> None:
        """Persists security violation to audit database."""
        event_id = f"sec_{uuid.uuid4().hex[:10]}"
        try:
            with self.manager.get_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO security_events
                    (event_id, event_type, severity, user_id, instruction, reason, details_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        event_id,
                        event_type,
                        severity,
                        user_id,
                        instruction,
                        reason,
                        json.dumps(details),
                    ),
                )
        except Exception:
            pass

    def list_security_events(self, limit: int = 50) -> List[dict]:
        """Lists recorded security events for forensic review."""
        with self.manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM security_events
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

            return [
                {
                    "event_id": r["event_id"],
                    "event_type": r["event_type"],
                    "severity": r["severity"],
                    "user_id": r["user_id"],
                    "instruction": r["instruction"],
                    "reason": r["reason"],
                    "details": json.loads(r["details_json"]) if r["details_json"] else {},
                    "created_at": r["created_at"],
                }
                for r in rows
            ]


security_sanitizer = SecuritySanitizer()
