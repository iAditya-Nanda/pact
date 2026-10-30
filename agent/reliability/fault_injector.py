from typing import Dict, Any, Optional
from collections import defaultdict


class FaultInjector:
    """
    Test harness for reliability, fault-injection, and resilience validation.
    Allows simulating intermittent downstream timeouts, rate-limits, and network partitions.
    """
    def __init__(self):
        self._fault_rules: Dict[str, Dict[str, Any]] = {}
        self._fault_counters: Dict[str, int] = defaultdict(int)

    def inject_fault(
        self,
        tool_name: str,
        failure_type: str = "TIMEOUT",
        error_message: str = "Simulated downstream service timeout",
        failure_count: int = 1,
    ) -> None:
        """Configures a tool to fail for N consecutive invocations before recovering."""
        self._fault_rules[tool_name] = {
            "failure_type": failure_type,
            "error_message": error_message,
            "failure_count": failure_count,
        }
        self._fault_counters[tool_name] = 0

    def clear_faults(self) -> None:
        """Clears all active fault rules."""
        self._fault_rules.clear()
        self._fault_counters.clear()

    def should_fail(self, tool_name: str) -> Optional[str]:
        """
        Checks whether the given tool should fail according to active injection rules.
        Returns the error message if a fault should trigger, or None if safe to proceed.
        """
        if tool_name not in self._fault_rules:
            return None

        rule = self._fault_rules[tool_name]
        current_count = self._fault_counters[tool_name]

        if current_count < rule["failure_count"]:
            self._fault_counters[tool_name] += 1
            return f"[{rule['failure_type']}] {rule['error_message']} (Simulated failure {current_count + 1}/{rule['failure_count']})"

        return None


fault_injector = FaultInjector()
