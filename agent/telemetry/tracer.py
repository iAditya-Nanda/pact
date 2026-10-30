import json
import time
import uuid
from contextvars import ContextVar
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from collections import deque

from agent.db.connection import DatabaseManager, db_manager
from agent.telemetry.models import ExecutionSpan, SpanStatus, TraceTree

# Context-local active span pointer
_active_span_var: ContextVar[Optional[ExecutionSpan]] = ContextVar("active_span", default=None)
_active_trace_id_var: ContextVar[Optional[str]] = ContextVar("active_trace_id", default=None)


class Tracer:
    def __init__(self, manager: DatabaseManager = db_manager, buffer_size: int = 1000):
        self.manager = manager
        self._recent_spans: deque = deque(maxlen=buffer_size)

    @contextmanager
    def start_span(
        self,
        name: str,
        trace_id: Optional[str] = None,
        attributes: Optional[Dict[str, Any]] = None,
    ):
        """
        Context manager that tracks execution duration, attributes, and nesting hierarchy.
        Persists the span on context exit.
        """
        parent_span = _active_span_var.get()
        resolved_trace_id = trace_id or _active_trace_id_var.get() or (parent_span.trace_id if parent_span else f"trace_{uuid.uuid4().hex[:12]}")
        parent_span_id = parent_span.span_id if parent_span else None
        span_id = f"span_{uuid.uuid4().hex[:10]}"

        start_perf = time.perf_counter()
        start_iso = datetime.now(timezone.utc).isoformat()

        span = ExecutionSpan(
            span_id=span_id,
            trace_id=resolved_trace_id,
            parent_span_id=parent_span_id,
            name=name,
            start_time=start_iso,
            end_time="",
            duration_ms=0.0,
            attributes=dict(attributes or {}),
            status=SpanStatus.OK,
        )

        token_span = _active_span_var.set(span)
        token_trace = _active_trace_id_var.set(resolved_trace_id)

        try:
            yield span
        except Exception as e:
            span.status = SpanStatus.ERROR
            span.error_message = str(e)
            span.attributes["error.type"] = type(e).__name__
            raise
        finally:
            end_perf = time.perf_counter()
            end_iso = datetime.now(timezone.utc).isoformat()
            duration_ms = round((end_perf - start_perf) * 1000, 2)

            span.end_time = end_iso
            span.duration_ms = duration_ms

            # Reset context
            _active_span_var.reset(token_span)
            _active_trace_id_var.reset(token_trace)

            # Record span
            self._record_span(span)

    def _record_span(self, span: ExecutionSpan) -> None:
        """Persists span to SQLite and in-memory buffer."""
        self._recent_spans.append(span)

        try:
            with self.manager.get_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO execution_spans
                    (span_id, trace_id, parent_span_id, name, start_time, end_time, duration_ms, attributes_json, status, error_message)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        span.span_id,
                        span.trace_id,
                        span.parent_span_id,
                        span.name,
                        span.start_time,
                        span.end_time,
                        span.duration_ms,
                        json.dumps(span.attributes, default=str),
                        span.status.value,
                        span.error_message,
                    ),
                )
        except Exception:
            # Observability shouldn't crash active execution
            pass

    def get_trace(self, trace_id: str) -> Optional[TraceTree]:
        """Reconstructs the hierarchical trace tree from SQLite or memory."""
        spans: List[ExecutionSpan] = []
        with self.manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM execution_spans
                WHERE trace_id = ?
                ORDER BY start_time ASC
                """,
                (trace_id,),
            ).fetchall()

            for r in rows:
                attrs = {}
                if r["attributes_json"]:
                    try:
                        attrs = json.loads(r["attributes_json"])
                    except Exception:
                        attrs = {}

                spans.append(
                    ExecutionSpan(
                        span_id=r["span_id"],
                        trace_id=r["trace_id"],
                        parent_span_id=r["parent_span_id"],
                        name=r["name"],
                        start_time=r["start_time"],
                        end_time=r["end_time"],
                        duration_ms=r["duration_ms"],
                        attributes=attrs,
                        status=SpanStatus(r["status"]),
                        error_message=r["error_message"],
                    )
                )

        if not spans:
            return None

        root_span = next((s for s in spans if not s.parent_span_id), spans[0])
        total_duration = max(s.duration_ms for s in spans)

        return TraceTree(
            trace_id=trace_id,
            root_span_name=root_span.name,
            total_duration_ms=total_duration,
            span_count=len(spans),
            spans=spans,
        )

    def list_recent_traces(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Lists recent distinct traces with summary metrics."""
        with self.manager.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT trace_id, 
                       MIN(start_time) as start_time, 
                       MAX(duration_ms) as total_duration_ms, 
                       COUNT(span_id) as span_count,
                       SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END) as error_count
                FROM execution_spans
                GROUP BY trace_id
                ORDER BY start_time DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

            return [
                {
                    "trace_id": r["trace_id"],
                    "start_time": r["start_time"],
                    "duration_ms": r["total_duration_ms"],
                    "span_count": r["span_count"],
                    "has_errors": bool(r["error_count"] > 0),
                }
                for r in rows
            ]


tracer = Tracer()
