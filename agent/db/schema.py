import sqlite3
from agent.db.connection import DatabaseManager, db_manager

SCHEMA_SQL = """
-- 1. User Preferences Table (Hard vs Soft Constraints)
CREATE TABLE IF NOT EXISTS user_preferences (
    preference_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    scope TEXT NOT NULL,
    rule_key TEXT NOT NULL,
    description TEXT NOT NULL,
    constraint_type TEXT NOT NULL DEFAULT 'SOFT',
    parameters_json TEXT NOT NULL DEFAULT '{}',
    allowed_overrides_json TEXT NOT NULL DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Agent Action Audit & Idempotency Ledger
CREATE TABLE IF NOT EXISTS agent_actions (
    action_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    risk_tier TEXT NOT NULL,
    status TEXT NOT NULL,
    parameters_json TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,
    result_json TEXT,
    error_message TEXT,
    is_verified INTEGER NOT NULL DEFAULT 0,
    verification_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Mock Email Store (Local Development & Testing)
CREATE TABLE IF NOT EXISTS mock_emails (
    email_id TEXT PRIMARY KEY,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'NORMAL',
    is_read INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'INBOX', -- INBOX, SENT, DRAFT, TRASH
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Mock Calendar Store (Local Development & Testing)
CREATE TABLE IF NOT EXISTS mock_calendar_events (
    event_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    attendees_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'CONFIRMED', -- CONFIRMED, TENTATIVE, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Mock Tasks Store (Local Development & Testing)
CREATE TABLE IF NOT EXISTS mock_tasks (
    task_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    priority TEXT NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Proactive Alerts Store
CREATE TABLE IF NOT EXISTS proactive_alerts (
    alert_id TEXT PRIMARY KEY,
    alert_type TEXT NOT NULL, -- CONFLICT, DEADLINE, STALE_THREAD
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    proposed_plan_json TEXT,
    status TEXT NOT NULL DEFAULT 'UNRESOLVED', -- UNRESOLVED, DISMISSED, ACTIONED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Distributed Execution Telemetry & Tracing Spans
CREATE TABLE IF NOT EXISTS execution_spans (
    span_id TEXT PRIMARY KEY,
    trace_id TEXT NOT NULL,
    parent_span_id TEXT,
    name TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_ms REAL NOT NULL,
    attributes_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'OK',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Security Audit & Injection Defense Events
CREATE TABLE IF NOT EXISTS security_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL, -- PROMPT_INJECTION, TAMPER_ATTEMPT, PRIVILEGE_ESCALATION
    severity TEXT NOT NULL,   -- LOW, MEDIUM, HIGH, CRITICAL
    user_id TEXT NOT NULL,
    instruction TEXT,
    reason TEXT NOT NULL,
    details_json TEXT NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance and deterministic lookups
CREATE INDEX IF NOT EXISTS idx_actions_idempotency ON agent_actions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_actions_run ON agent_actions(run_id);
CREATE INDEX IF NOT EXISTS idx_cal_times ON mock_calendar_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_pref_scope ON user_preferences(user_id, scope, is_active);
CREATE INDEX IF NOT EXISTS idx_spans_trace ON execution_spans(trace_id);
CREATE INDEX IF NOT EXISTS idx_sec_events_user ON security_events(user_id);
"""


def init_database(manager: DatabaseManager = db_manager) -> None:
    """Initialize all core tables and indices."""
    with manager.get_connection() as conn:
        conn.executescript(SCHEMA_SQL)


def seed_mock_data(manager: DatabaseManager = db_manager) -> None:
    """Seed initial realistic mock data for offline development testing."""
    with manager.get_connection() as conn:
        # 1. Seed standard user preferences
        conn.execute("""
            INSERT OR IGNORE INTO user_preferences 
            (preference_id, user_id, scope, rule_key, description, constraint_type, parameters_json, allowed_overrides_json, is_active)
            VALUES 
            ('pref_no_morning_sync', 'default_user', 'CALENDAR', 'no_meetings_before_10am', 
             'Avoid scheduling meetings before 10:00 AM to preserve deep focus time', 'SOFT',
             '{"cutoff_time": "10:00"}', '["sarah.chen@acme.corp", "ceo@acme.corp"]', 1),
            ('pref_child_pickup', 'default_user', 'CALENDAR', 'child_pickup_block',
             'Never schedule meetings between 3:00 PM and 4:00 PM (Hard Constraint)', 'HARD',
             '{"start_time": "15:00", "end_time": "16:00"}', '[]', 1)
        """)

        # 2. Seed mock emails (e.g. urgent email from Sarah Chen requesting prep meeting)
        conn.execute("""
            INSERT OR IGNORE INTO mock_emails
            (email_id, sender, recipient, subject, body, priority, is_read, status)
            VALUES
            ('email_001', 'sarah.chen@acme.corp', 'user@acme.corp', 
             'Urgent: Need 30m review before Friday Product Release', 
             'Hey, can we schedule a quick 30-minute sync to review the release checklist before Friday noon? Let me know what time works best.',
             'HIGH', 0, 'INBOX')
        """)

        # 3. Seed mock calendar events
        conn.execute("""
            INSERT OR IGNORE INTO mock_calendar_events
            (event_id, title, description, start_time, end_time, attendees_json, status)
            VALUES
            ('evt_001', 'Sprint Planning', 'Weekly sprint planning with core engineering',
             '2026-10-31 10:00:00', '2026-10-31 11:30:00', '["team@acme.corp"]', 'CONFIRMED'),
            ('evt_002', 'Product Architecture Review', 'Deep dive into service boundaries',
             '2026-10-31 14:00:00', '2026-10-31 15:00:00', '["architects@acme.corp"]', 'CONFIRMED')
        """)

        # 4. Seed mock tasks
        conn.execute("""
            INSERT OR IGNORE INTO mock_tasks
            (task_id, title, description, due_date, priority, status)
            VALUES
            ('task_001', 'Finalize Product Release Checklist', 'Complete security verification and test signoffs',
             '2026-10-31 12:00:00', 'URGENT', 'PENDING')
        """)
