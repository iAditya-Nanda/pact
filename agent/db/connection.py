import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager

# Default path is in the workspace database folder
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent / "database" / "pact_agent.db"


class DatabaseManager:
    def __init__(self, db_path: Path = DEFAULT_DB_PATH):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    @contextmanager
    def get_connection(self):
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
