import os
import sqlite3
from pathlib import Path
from contextlib import contextmanager
from typing import Optional, Any

try:
    import psycopg
    from psycopg.rows import dict_row
    HAS_PSYCOPG = True
except ImportError:
    HAS_PSYCOPG = False

# Default PostgreSQL connection URL for Supabase local
DEFAULT_PG_URL = os.getenv(
    "DATABASE_URL",
    os.getenv("SUPABASE_DB_URL", "postgresql://postgres:postgres@127.0.0.1:54322/postgres")
)

# Default path is in the workspace database folder
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent / "database" / "pact_agent.db"


def convert_sqlite_to_pg(sql: str) -> str:
    """Translates standard SQLite syntax to PostgreSQL syntax."""
    out = []
    in_single = False
    in_double = False
    for ch in sql:
        if ch == "'" and not in_double:
            in_single = not in_single
            out.append(ch)
        elif ch == '"' and not in_single:
            in_double = not in_double
            out.append(ch)
        elif ch == "?" and not in_single and not in_double:
            out.append("%s")
        else:
            out.append(ch)
    converted = "".join(out)
    if "INSERT OR IGNORE INTO" in converted:
        converted = converted.replace("INSERT OR IGNORE INTO", "INSERT INTO")
        if "ON CONFLICT" not in converted:
            converted = converted.rstrip("; \n") + " ON CONFLICT DO NOTHING;"
    return converted


class DictRow(dict):
    """Dictionary subclass supporting both string key and integer index access."""
    def __getitem__(self, key: Any) -> Any:
        if isinstance(key, int):
            return list(self.values())[key]
        return super().__getitem__(key)


class PGCursorWrapper:
    """Wraps psycopg cursor to return DictRow objects and expose rowcount."""
    def __init__(self, raw_cur):
        self.raw_cur = raw_cur

    @property
    def rowcount(self) -> int:
        return self.raw_cur.rowcount

    def fetchone(self) -> Optional[DictRow]:
        r = self.raw_cur.fetchone()
        if r is None:
            return None
        return DictRow(r)

    def fetchall(self) -> list:
        rows = self.raw_cur.fetchall()
        return [DictRow(r) for r in rows]


class PGConnectionWrapper:
    """Wraps psycopg connection with SQLite compatibility for execute/executescript."""
    def __init__(self, raw_conn):
        self.raw_conn = raw_conn

    def execute(self, sql: str, params: Any = None) -> PGCursorWrapper:
        converted = convert_sqlite_to_pg(sql)
        if params is not None:
            cur = self.raw_conn.execute(converted, params)
        else:
            cur = self.raw_conn.execute(converted)
        return PGCursorWrapper(cur)

    def executescript(self, script: str) -> None:
        converted = convert_sqlite_to_pg(script)
        self.raw_conn.execute(converted)

    def commit(self) -> None:
        self.raw_conn.commit()

    def rollback(self) -> None:
        self.raw_conn.rollback()

    def close(self) -> None:
        self.raw_conn.close()


class DatabaseManager:
    """
    Manages database connections for PACT Agent.
    Prioritizes Supabase Local PostgreSQL, seamlessly falling back to SQLite when required.
    """
    def __init__(self, db_path: Path = DEFAULT_DB_PATH, dsn: Optional[str] = None):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.dsn = dsn or DEFAULT_PG_URL
        self._force_sqlite = (
            os.getenv("USE_SQLITE", "").lower() in ("true", "1")
            or not HAS_PSYCOPG
            or (str(self.db_path) != str(DEFAULT_DB_PATH) and not str(self.db_path).endswith("pact_agent.db"))
        )

    @property
    def is_postgres(self) -> bool:
        if self._force_sqlite:
            return False
        try:
            with psycopg.connect(self.dsn, row_factory=dict_row, connect_timeout=2) as test_conn:
                test_conn.execute("SELECT 1;")
            return True
        except Exception:
            return False

    @property
    def engine_name(self) -> str:
        return "Supabase Local PostgreSQL" if self.is_postgres else "SQLite WAL"

    @contextmanager
    def get_connection(self):
        use_pg = False
        raw_conn = None
        if not self._force_sqlite and HAS_PSYCOPG:
            try:
                raw_conn = psycopg.connect(self.dsn, row_factory=dict_row, connect_timeout=2)
                use_pg = True
            except Exception:
                use_pg = False

        if use_pg and raw_conn is not None:
            wrapper = PGConnectionWrapper(raw_conn)
            try:
                yield wrapper
                wrapper.commit()
            except Exception:
                wrapper.rollback()
                raise
            finally:
                wrapper.close()
            return

        # SQLite execution path
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA journal_mode = WAL;")
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


# Default singleton instance
db_manager = DatabaseManager()
