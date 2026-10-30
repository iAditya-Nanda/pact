import json
import re
from typing import Dict, Any, Optional, Type, TypeVar
import httpx
from pydantic import BaseModel
from agent.engine.config import EngineConfig, engine_config

T = TypeVar("T", bound=BaseModel)


class LocalLLMClient:
    def __init__(self, config: EngineConfig = engine_config):
        self.config = config

    def generate_structured(
        self,
        prompt: str,
        system_prompt: str,
        response_model: Type[T],
        model_name: Optional[str] = None,
        mock_fallback: Optional[Dict[str, Any]] = None,
    ) -> T:
        """
        Invokes local C++ model runtime (Ollama / llama.cpp) and parses output directly into a validated Pydantic model.
        Uses format={json_schema} for constrained token generation.
        """
        target_model = model_name or self.config.tier_a_model
        schema = response_model.model_json_schema()

        payload = {
            "model": target_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            "format": schema,
            "stream": False,
            "options": {
                "temperature": self.config.temperature,
            },
        }

        try:
            with httpx.Client(timeout=self.config.request_timeout) as client:
                res = client.post(
                    f"{self.config.ollama_base_url}/api/chat",
                    json=payload,
                )
                res.raise_for_status()
                data = res.json()
                raw_content = data.get("message", {}).get("content", "{}")
                clean_json = self._clean_json_string(raw_content)
                parsed_data = json.loads(clean_json)
                return response_model.model_validate(parsed_data)
        except Exception as e:
            if mock_fallback is not None:
                return response_model.model_validate(mock_fallback)
            raise RuntimeError(f"Local LLM inference failed on model '{target_model}': {e}") from e

    async def generate_structured_async(
        self,
        prompt: str,
        system_prompt: str,
        response_model: Type[T],
        model_name: Optional[str] = None,
        mock_fallback: Optional[Dict[str, Any]] = None,
    ) -> T:
        """Asynchronous variant of generate_structured."""
        target_model = model_name or self.config.tier_a_model
        schema = response_model.model_json_schema()

        payload = {
            "model": target_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            "format": schema,
            "stream": False,
            "options": {
                "temperature": self.config.temperature,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.config.request_timeout) as client:
                res = await client.post(
                    f"{self.config.ollama_base_url}/api/chat",
                    json=payload,
                )
                res.raise_for_status()
                data = res.json()
                raw_content = data.get("message", {}).get("content", "{}")
                clean_json = self._clean_json_string(raw_content)
                parsed_data = json.loads(clean_json)
                return response_model.model_validate(parsed_data)
        except Exception as e:
            if mock_fallback is not None:
                return response_model.model_validate(mock_fallback)
            raise RuntimeError(f"Local async LLM inference failed on model '{target_model}': {e}") from e

    def _clean_json_string(self, text: str) -> str:
        """Strip markdown codeblocks and extraneous characters if model emitted formatting wrappers."""
        text = text.strip()
        # Remove ```json ... ``` codeblocks
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1).strip()
        return text


local_llm_client = LocalLLMClient()
