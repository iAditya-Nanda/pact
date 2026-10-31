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
        using the in-process pure C++ llama.cpp local LLM.
        """
        user_prompt = f"""
{INTENT_FEW_SHOTS}

Now analyze this instruction:
User: "{instruction}"
"""
        fallback_data = self._heuristic_fallback(instruction)

        try:
            intent = self.client.generate_structured(
                prompt=user_prompt,
                system_prompt=INTENT_SYSTEM_PROMPT,
                response_model=ParsedIntent,
                model_name=self.client.config.tier_a_model,
                mock_fallback=fallback_data,
            )
        except Exception:
            intent = ParsedIntent.model_validate(fallback_data)

        intent.raw_instruction = instruction
        return intent

    def _heuristic_fallback(self, instruction: str) -> dict:
        """High-precision regex and semantic heuristic extraction."""
        import re
        lower = instruction.lower().strip()

        # Check for ambiguity requiring clarification:
        if lower in ["cancel my meeting", "cancel meeting", "reschedule my meeting", "move my meeting"]:
            return {
                "category": IntentCategory.CALENDAR.value,
                "action": ActionType.DELETE.value if "cancel" in lower else ActionType.UPDATE.value,
                "confidence": 0.95,
                "entities": {"raw": instruction},
                "missing_fields": ["event_id", "time"],
                "requires_clarification": True,
                "clarification_prompt": "Which meeting would you like to cancel? Please specify the title, attendee, or time.",
                "raw_instruction": instruction,
            }

        entities = {"raw": instruction}

        # Extract email address if present
        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', instruction)
        if email_match:
            entities["recipient"] = email_match.group(0)
            entities["to"] = email_match.group(0)

        # Extract search query for email searches
        if any(w in lower for w in ["search", "find", "check"]) and any(w in lower for w in ["email", "mail", "inbox"]):
            for sender in ["renee", "cline", "adobe", "mapbox", "supabase", "google", "kshitij", "nexsemi"]:
                if sender in lower:
                    entities["query"] = sender
                    entities["sender"] = sender
                    break

        if any(w in lower for w in ["meeting", "schedule", "calendar", "reschedule", "event", "sync", "debrief"]):
            category = IntentCategory.CALENDAR
            if any(w in lower for w in ["cancel", "delete", "remove", "drop"]):
                action = ActionType.DELETE
            elif any(w in lower for w in ["move", "reschedule", "shift", "postpone", "delay", "change"]):
                action = ActionType.UPDATE
            elif any(w in lower for w in ["check", "find", "list", "show", "free", "conflict", "today"]):
                action = ActionType.QUERY
            else:
                action = ActionType.CREATE
            confidence = 0.95
        elif any(w in lower for w in ["email", "inbox", "mail", "@"]):
            category = IntentCategory.EMAIL
            if any(w in lower for w in ["send", "reply", "forward", "draft", "write"]):
                action = ActionType.CREATE
            elif any(w in lower for w in ["delete", "trash", "remove"]):
                action = ActionType.DELETE
            else:
                action = ActionType.QUERY
            confidence = 0.95
        elif any(w in lower for w in ["task", "todo", "deadline"]):
            category = IntentCategory.TASK
            if any(w in lower for w in ["add", "create", "new"]):
                action = ActionType.CREATE
            elif any(w in lower for w in ["complete", "finish", "done", "delete"]):
                action = ActionType.UPDATE
            else:
                action = ActionType.QUERY
            confidence = 0.95
        else:
            category = IntentCategory.CROSS_APP
            action = ActionType.EXECUTE
            confidence = 0.70

        return {
            "category": category.value,
            "action": action.value,
            "confidence": confidence,
            "entities": entities,
            "missing_fields": [],
            "requires_clarification": False,
            "clarification_prompt": None,
            "raw_instruction": instruction,
        }


intent_service = IntentExtractionService()
