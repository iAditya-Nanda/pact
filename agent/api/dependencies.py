from fastapi import Depends
from agent.core.orchestrator import orchestrator, AgentOrchestrator
from agent.db.connection import db_manager, DatabaseManager
from agent.db.preferences_repo import PreferencesRepository
from agent.db.alerts_repo import AlertsRepository
from agent.proactive.scanner import ProactiveScanner


def get_db_manager() -> DatabaseManager:
    return db_manager


def get_orchestrator() -> AgentOrchestrator:
    return orchestrator


def get_pref_repo(manager: DatabaseManager = Depends(get_db_manager)) -> PreferencesRepository:
    return PreferencesRepository(manager=manager)


def get_alerts_repo(manager: DatabaseManager = Depends(get_db_manager)) -> AlertsRepository:
    return AlertsRepository(manager=manager)


def get_scanner(manager: DatabaseManager = Depends(get_db_manager)) -> ProactiveScanner:
    return ProactiveScanner(manager=manager)
