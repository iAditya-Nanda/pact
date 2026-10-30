import logging
from typing import List
from apscheduler.schedulers.background import BackgroundScheduler
from agent.proactive.scanner import ProactiveScanner, proactive_scanner
from agent.db.alerts_repo import AlertsRepository, alerts_repo
from agent.models.alerts import ProactiveAlert

logger = logging.getLogger(__name__)


class ProactiveScheduler:
    def __init__(self, scanner: ProactiveScanner = proactive_scanner, repo: AlertsRepository = alerts_repo):
        self.scanner = scanner
        self.repo = repo
        self.scheduler = BackgroundScheduler()
        self._is_running = False

    def run_sweep(self, user_id: str = "default_user") -> List[ProactiveAlert]:
        """
        Executes an immediate proactive scan across calendar, emails, and tasks.
        Persists detected alerts into the database and returns them.
        """
        detected_alerts = self.scanner.scan_all(user_id=user_id)
        saved_alerts = []
        for alert in detected_alerts:
            self.repo.create_alert(alert)
            saved_alerts.append(alert)
        return saved_alerts

    def start(self, interval_seconds: int = 60) -> None:
        """Starts periodic background monitoring."""
        if not self._is_running:
            self.scheduler.add_job(
                self.run_sweep,
                "interval",
                seconds=interval_seconds,
                id="proactive_sweep_job",
                replace_existing=True,
            )
            self.scheduler.start()
            self._is_running = True

    def stop(self) -> None:
        """Gracefully halts the background scheduler."""
        if self._is_running:
            self.scheduler.shutdown(wait=False)
            self._is_running = False


proactive_scheduler = ProactiveScheduler()
