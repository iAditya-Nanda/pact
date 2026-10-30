from fastapi import Depends
from agent.core.orchestrator import orchestrator, AgentOrchestrator
from agent.db.connection import db_manager, DatabaseManager
from agent.db.preferences_repo import PreferencesRepository
from agent.db.alerts_repo import AlertsRepository
from agent.db.audit_repo import AuditRepository
from agent.proactive.scanner import ProactiveScanner
from agent.telemetry.tracer import tracer, Tracer
from agent.telemetry.metrics import metrics_collector, MetricsCollector
from agent.security.sanitizer import security_sanitizer, SecuritySanitizer


def get_db_manager() -> DatabaseManager:
    return db_manager


def get_orchestrator() -> AgentOrchestrator:
    return orchestrator


def get_pref_repo(manager: DatabaseManager = Depends(get_db_manager)) -> PreferencesRepository:
    return PreferencesRepository(manager=manager)


def get_alerts_repo(manager: DatabaseManager = Depends(get_db_manager)) -> AlertsRepository:
    return AlertsRepository(manager=manager)


def get_audit_repo(manager: DatabaseManager = Depends(get_db_manager)) -> AuditRepository:
    return AuditRepository(manager=manager)


def get_scanner(manager: DatabaseManager = Depends(get_db_manager)) -> ProactiveScanner:
    return ProactiveScanner(manager=manager)


def get_tracer(manager: DatabaseManager = Depends(get_db_manager)) -> Tracer:
    return Tracer(manager=manager)


def get_metrics_collector(manager: DatabaseManager = Depends(get_db_manager)) -> MetricsCollector:
    return MetricsCollector(manager=manager)


def get_security_sanitizer(manager: DatabaseManager = Depends(get_db_manager)) -> SecuritySanitizer:
    return SecuritySanitizer(manager=manager)
