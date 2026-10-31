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


def init_database(manager: DatabaseManager = db_manager, sync_live: bool = True) -> None:
    """Initialize all core tables and indices, and sync live workspace data."""
    with manager.get_connection() as conn:
        conn.executescript(SCHEMA_SQL)
    seed_mock_data(manager)
    if sync_live and (manager.is_postgres or str(manager.db_path).endswith("pact_agent.db")):
        sync_workspace_data(manager)


def normalize_time_str(time_str: str) -> str:
    """Normalizes 12h or raw string time to standard ISO timestamp for SQLite range queries."""
    if not time_str:
        return "2026-10-31 10:00:00"
    clean = time_str.strip()
    if clean.startswith("2026-"):
        return clean
    try:
        from datetime import datetime
        dt = datetime.strptime(clean, "%I:%M %p")
        return f"2026-10-31 {dt.strftime('%H:%M:%S')}"
    except Exception:
        return f"2026-10-31 10:00:00"


def sync_workspace_data(manager: DatabaseManager = db_manager) -> None:
    """
    Synchronizes real Google Workspace data from web/.data/workspace.json directly into SQLite,
    ensuring all AI tool invocations operate on real live user messages, events, and tasks.
    """
    import json
    from pathlib import Path

    workspace_candidates = [
        Path(__file__).resolve().parent.parent.parent / "web" / ".data" / "workspace.json",
        Path(__file__).resolve().parent.parent.parent / ".data" / "workspace.json",
    ]

    workspace_file = None
    for cand in workspace_candidates:
        if cand.exists():
            workspace_file = cand
            break

    if not workspace_file:
        return

    try:
        data = json.loads(workspace_file.read_text(encoding="utf-8"))
        user_email = data.get("user", {}).get("email", "adityananda.dev@gmail.com")

        with manager.get_connection() as conn:
            # 1. Sync Emails from real Google Workspace
            for em in data.get("emails", []):
                eid = em.get("id")
                sender = em.get("sender", "Unknown")
                subject = em.get("subject", "No Subject")
                snippet = em.get("snippet", "")
                priority = str(em.get("priority", "NORMAL")).upper()
                is_read = 1 if em.get("status") == "read" else 0
                received_at = em.get("receivedAt", "")

                conn.execute(
                    """
                    INSERT INTO mock_emails
                    (email_id, sender, recipient, subject, body, priority, is_read, status, received_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'INBOX', ?)
                    ON CONFLICT(email_id) DO UPDATE SET
                        sender=excluded.sender,
                        subject=excluded.subject,
                        body=excluded.body,
                        priority=excluded.priority,
                        is_read=excluded.is_read,
                        received_at=excluded.received_at;
                    """,
                    (eid, sender, user_email, subject, snippet, priority, is_read, received_at),
                )
                if manager.is_postgres:
                    conn.execute(
                        """
                        INSERT INTO emails
                        (id, user_id, sender, recipient, subject, body, priority, status, received_at)
                        VALUES (?, 'default_user', ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            sender=excluded.sender,
                            subject=excluded.subject,
                            body=excluded.body,
                            priority=excluded.priority,
                            status=excluded.status,
                            received_at=excluded.received_at;
                        """,
                        (eid, sender, user_email, subject, snippet, priority.lower(), "read" if is_read else "unread", received_at),
                    )

            # 2. Sync Calendar Events (preserve default core events evt_001 / evt_002)
            for evt in data.get("calendarEvents", []):
                ev_id = evt.get("id")
                if ev_id in ["evt_001", "evt_002"]:
                    ev_id = f"ws_{ev_id}"

                title = evt.get("title", "Event")
                desc = evt.get("description", "")
                start_time = normalize_time_str(evt.get("startTime", "10:00 AM"))
                end_time = normalize_time_str(evt.get("endTime", "11:00 AM"))
                status = str(evt.get("status", "CONFIRMED")).upper()

                conn.execute(
                    """
                    INSERT INTO mock_calendar_events
                    (event_id, title, description, start_time, end_time, attendees_json, status)
                    VALUES (?, ?, ?, ?, ?, '[]', ?)
                    ON CONFLICT(event_id) DO UPDATE SET
                        title=excluded.title,
                        description=excluded.description,
                        start_time=excluded.start_time,
                        end_time=excluded.end_time,
                        status=excluded.status;
                    """,
                    (ev_id, title, desc, start_time, end_time, status),
                )
                if manager.is_postgres:
                    conn.execute(
                        """
                        INSERT INTO calendar_events
                        (id, user_id, title, description, start_time, end_time, attendees, status)
                        VALUES (?, 'default_user', ?, ?, ?, ?, '[]', ?)
                        ON CONFLICT(id) DO UPDATE SET
                            title=excluded.title,
                            description=excluded.description,
                            start_time=excluded.start_time,
                            end_time=excluded.end_time,
                            status=excluded.status;
                        """,
                        (ev_id, title, desc, start_time, end_time, status.lower()),
                    )

            # 3. Sync Tasks
            for tsk in data.get("tasks", []):
                t_id = tsk.get("id")
                t_title = tsk.get("title", "Task")
                t_desc = tsk.get("description", "")
                due = tsk.get("dueDate", "Today")
                priority = str(tsk.get("priority", "MEDIUM")).upper()
                status = "COMPLETED" if tsk.get("status") == "completed" else "PENDING"

                conn.execute(
                    """
                    INSERT INTO mock_tasks
                    (task_id, title, description, due_date, priority, status)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(task_id) DO UPDATE SET
                        title=excluded.title,
                        description=excluded.description,
                        due_date=excluded.due_date,
                        priority=excluded.priority,
                        status=excluded.status;
                    """,
                    (t_id, t_title, t_desc, due, priority, status),
                )
                if manager.is_postgres:
                    conn.execute(
                        """
                        INSERT INTO tasks
                        (id, user_id, title, description, due_date, priority, status, source)
                        VALUES (?, 'default_user', ?, ?, ?, ?, ?, 'workspace')
                        ON CONFLICT(id) DO UPDATE SET
                            title=excluded.title,
                            description=excluded.description,
                            due_date=excluded.due_date,
                            priority=excluded.priority,
                            status=excluded.status;
                        """,
                        (t_id, t_title, t_desc, due, priority.lower(), "completed" if status == "COMPLETED" else "pending"),
                    )
    except Exception as e:
        print(f"Warning: Failed to sync workspace.json to SQLite: {e}")


def sync_sqlite_to_workspace_json(manager: DatabaseManager = db_manager) -> None:
    """
    Exports live SQLite tables back to web/.data/workspace.json so that UI components
    reflect AI modifications (new tasks, sent emails, rescheduled events) in real time.
    """
    import json
    from pathlib import Path

    workspace_candidates = [
        Path(__file__).resolve().parent.parent.parent / "web" / ".data" / "workspace.json",
        Path(__file__).resolve().parent.parent.parent / ".data" / "workspace.json",
    ]

    workspace_file = None
    for cand in workspace_candidates:
        if cand.exists():
            workspace_file = cand
            break

    if not workspace_file:
        return

    try:
        data = json.loads(workspace_file.read_text(encoding="utf-8"))

        with manager.get_connection() as conn:
            # 1. Export Tasks
            task_rows = conn.execute("SELECT * FROM mock_tasks ORDER BY due_date ASC;").fetchall()
            exported_tasks = []
            active_count = 0
            for r in task_rows:
                is_completed = r["status"] == "COMPLETED"
                if not is_completed:
                    active_count += 1
                exported_tasks.append({
                    "id": r["task_id"],
                    "title": r["title"],
                    "description": r["description"] or "",
                    "dueDate": r["due_date"] or "Today",
                    "priority": (r["priority"] or "normal").lower(),
                    "status": "completed" if is_completed else "pending",
                    "isDueToday": True,
                    "isOverdue": False,
                })
            data["tasks"] = exported_tasks
            if "metrics" in data:
                data["metrics"]["activeTasks"] = active_count

            # 2. Export Calendar Events
            cal_rows = conn.execute("SELECT * FROM mock_calendar_events WHERE status != 'CANCELLED' ORDER BY start_time ASC;").fetchall()
            exported_cal = []
            for r in cal_rows:
                exported_cal.append({
                    "id": r["event_id"],
                    "title": r["title"],
                    "description": r["description"] or "",
                    "startTime": r["start_time"],
                    "endTime": r["end_time"],
                    "location": "Google Meet",
                    "status": "confirmed",
                    "conflictDetected": False,
                    "isToday": True,
                    "hours": 1.0,
                })
            data["calendarEvents"] = exported_cal
            if "metrics" in data:
                data["metrics"]["meetingsToday"] = len(exported_cal)

            # 3. Export Emails
            email_rows = conn.execute("SELECT * FROM mock_emails ORDER BY received_at DESC;").fetchall()
            exported_emails = []
            unread_count = 0
            for r in email_rows:
                is_read = bool(r["is_read"])
                if not is_read:
                    unread_count += 1
                exported_emails.append({
                    "id": r["email_id"],
                    "sender": r["sender"],
                    "senderEmail": r["sender"] if "@" in r["sender"] else f"{r['sender'].lower().replace(' ', '.')}@gmail.com",
                    "subject": r["subject"],
                    "snippet": r["body"] or "",
                    "receivedAt": r["received_at"] or "Recently",
                    "priority": (r["priority"] or "normal").lower(),
                    "status": "read" if is_read else "unread",
                    "thisMonth": True,
                })
            data["emails"] = exported_emails
            if "metrics" in data:
                data["metrics"]["unreadEmails"] = unread_count
                data["metrics"]["emailsThisMonth"] = len(exported_emails)

        workspace_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception as e:
        print(f"Warning: Failed to export SQLite to workspace.json: {e}")




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


# Universal alias supporting both Supabase PostgreSQL and SQLite
sync_db_to_workspace_json = sync_sqlite_to_workspace_json

