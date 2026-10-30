from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class SpanStatus(str, Enum):
    OK = "OK"
    ERROR = "ERROR"


class ExecutionSpan(BaseModel):
    span_id: str
    trace_id: str
    parent_span_id: Optional[str] = None
    name: str
    start_time: str
    end_time: str
    duration_ms: float
    attributes: Dict[str, Any] = Field(default_factory=dict)
    status: SpanStatus = SpanStatus.OK
    error_message: Optional[str] = None


class TraceTree(BaseModel):
    trace_id: str
    root_span_name: str
    total_duration_ms: float
    span_count: int
    spans: List[ExecutionSpan] = Field(default_factory=list)


class SystemMetrics(BaseModel):
    total_runs: int
    completed_runs: int
    failed_runs: int
    suspended_runs: int
    success_rate_percent: float
    average_latency_ms: float
    latency_p50_ms: float
    latency_p95_ms: float
    total_tool_calls: int
    tool_distribution: Dict[str, int] = Field(default_factory=dict)
    active_threats_blocked: int
