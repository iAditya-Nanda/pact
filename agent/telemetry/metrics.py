import math
from typing import Dict, Any, List
from agent.db.connection import DatabaseManager, db_manager
from agent.telemetry.models import SystemMetrics


class MetricsCollector:
    def __init__(self, manager: DatabaseManager = db_manager):
        self.manager = manager

    def get_system_metrics(self) -> SystemMetrics:
        """Calculates real-time performance, latency percentiles, and tool statistics."""
        with self.manager.get_connection() as conn:
            # 1. Spans latency metrics
            span_rows = conn.execute(
                "SELECT duration_ms FROM execution_spans ORDER BY duration_ms ASC"
            ).fetchall()
            durations = [r["duration_ms"] for r in span_rows]

            avg_latency = round(sum(durations) / len(durations), 2) if durations else 0.0
            p50 = durations[math.floor(len(durations) * 0.50)] if durations else 0.0
            p95 = durations[math.floor(len(durations) * 0.95)] if durations else 0.0

            # 2. Agent actions / tool calls
            tool_rows = conn.execute(
                "SELECT tool_name, COUNT(*) as count FROM agent_actions GROUP BY tool_name"
            ).fetchall()
            tool_dist = {r["tool_name"]: r["count"] for r in tool_rows}
            total_tool_calls = sum(tool_dist.values())

            # 3. Security events blocked
            sec_count = conn.execute(
                "SELECT COUNT(*) as count FROM security_events"
            ).fetchone()["count"]

            # 4. Traces / Runs breakdown
            run_rows = conn.execute(
                """
                SELECT 
                    COUNT(DISTINCT trace_id) as total_runs,
                    SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END) as failed_runs
                FROM execution_spans
                """
            ).fetchone()

            total_runs = run_rows["total_runs"] or 0
            failed_runs = run_rows["failed_runs"] or 0
            completed_runs = max(0, total_runs - failed_runs)
            success_rate = round((completed_runs / total_runs) * 100, 1) if total_runs > 0 else 100.0

            return SystemMetrics(
                total_runs=total_runs,
                completed_runs=completed_runs,
                failed_runs=failed_runs,
                suspended_runs=0,
                success_rate_percent=success_rate,
                average_latency_ms=avg_latency,
                latency_p50_ms=p50,
                latency_p95_ms=p95,
                total_tool_calls=total_tool_calls,
                tool_distribution=tool_dist,
                active_threats_blocked=sec_count,
            )


metrics_collector = MetricsCollector()
