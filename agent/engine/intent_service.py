from typing import Optional
from agent.engine.client import LocalLLMClient, local_llm_client
from agent.engine.prompts import INTENT_SYSTEM_PROMPT, INTENT_FEW_SHOTS
from agent.models.intent import ParsedIntent, IntentCategory, ActionType


class IntentExtractionService:
    def __init__(self, client: LocalLLMClient = local_llm_client):
        self.client = client

    def extract_intent(self, instruction: str) -> ParsedIntent:
        """
        Parses a natural language instruction into a validated ParsedIntent object
        using the Tier A local model.
        """
        user_prompt = f"""
{INTENT_FEW_SHOTS}

Now analyze this instruction:
User: "{instruction}"
"""
        # Deterministic fallback in case local engine is unreachable during headless tests
        fallback_data = self._heuristic_fallback(instruction)

        intent = self.client.generate_structured(
            prompt=user_prompt,
            system_prompt=INTENT_SYSTEM_PROMPT,
            response_model=ParsedIntent,
            model_name=self.client.config.tier_a_model,
            mock_fallback=fallback_data,
        )
        intent.raw_instruction = instruction
        return intent

    def _heuristic_fallback(self, instruction: str) -> dict:
        """Lightweight regex/keyword fallback for headless offline test execution."""
        lower = instruction.lower()
        if any(w in lower for w in ["email", "inbox", "mail"]):
            category = IntentCategory.EMAIL
            action = ActionType.CREATE if "send" in lower or "draft" in lower else ActionType.QUERY
        elif any(w in lower for w in ["meeting", "schedule", "calendar", "reschedule", "event"]):
            category = IntentCategory.CALENDAR
            action = ActionType.UPDATE if "reschedule" in lower else ActionType.CREATE
        elif any(w in lower for w in ["task", "todo", "deadline"]):
            category = IntentCategory.TASK
            action = ActionType.CREATE if "add" in lower or "create" in lower else ActionType.QUERY
        else:
            category = IntentCategory.CROSS_APP
            action = ActionType.EXECUTE

        return {
            "category": category.value,
            "action": action.value,
            "confidence": 0.85,
            "entities": {"raw": instruction},
            "missing_fields": [],
            "requires_clarification": False,
            "clarification_prompt": None,
            "raw_instruction": instruction,
        }


intent_service = IntentExtractionService()
