import atexit
import json
import os
import re
from pathlib import Path
from typing import Dict, Any, Optional, Type, TypeVar
from pydantic import BaseModel
from agent.engine.config import EngineConfig, engine_config

T = TypeVar("T", bound=BaseModel)


class LocalLLMClient:
    def __init__(self, config: EngineConfig = engine_config):
        self.config = config
        self._llm = None
        self._initialized = False
        atexit.register(self._cleanup)

    def _cleanup(self):
        """Safely release pure C++ llama.cpp model context and Metal GPU buffers on process teardown."""
        if self._llm is not None:
            try:
                del self._llm
                self._llm = None
            except Exception:
                pass

    def _get_llm(self):
        """Lazy-load the in-process pure C++ llama.cpp runtime with Metal GPU acceleration."""
        if self._initialized:
            return self._llm

        model_path = Path(self.config.model_path)
        if model_path.exists():
            try:
                from llama_cpp import Llama
                self._llm = Llama(
                    model_path=str(model_path),
                    n_gpu_layers=self.config.n_gpu_layers,
                    n_ctx=self.config.n_ctx,
                    verbose=False,
                )
            except Exception:
                self._llm = None
        self._initialized = True
        return self._llm

    def generate_structured(
        self,
        prompt: str,
        system_prompt: str,
        response_model: Type[T],
        model_name: Optional[str] = None,
        mock_fallback: Optional[Dict[str, Any]] = None,
    ) -> T:
        """
        Executes in-process pure C++ llama.cpp token generation with constrained schema parsing.
        """
        llm = self._get_llm()
        schema = response_model.model_json_schema()

        if llm is not None:
            try:
                messages = [
                    {
                        "role": "system",
                        "content": f"{system_prompt}\nYou MUST output valid JSON conforming to this schema: {json.dumps(schema)}",
                    },
                    {"role": "user", "content": prompt},
                ]
                output = llm.create_chat_completion(
                    messages=messages,
                    temperature=self.config.temperature,
                    response_format={"type": "json_object", "schema": schema},
                )
                raw_content = output["choices"][0]["message"]["content"]
                clean_json = self._clean_json_string(raw_content)
                parsed_data = json.loads(clean_json)
                return response_model.model_validate(parsed_data)
            except Exception as e:
                if mock_fallback is not None:
                    return response_model.model_validate(mock_fallback)
                raise RuntimeError(f"llama.cpp in-process inference error: {e}") from e

        if mock_fallback is not None:
            return response_model.model_validate(mock_fallback)

        raise RuntimeError(
            f"Pure C++ llama.cpp model not available at '{self.config.model_path}' and no fallback provided."
        )

    async def generate_structured_async(
        self,
        prompt: str,
        system_prompt: str,
        response_model: Type[T],
        model_name: Optional[str] = None,
        mock_fallback: Optional[Dict[str, Any]] = None,
    ) -> T:
        """Asynchronous execution for structured model synthesis."""
        return self.generate_structured(
            prompt=prompt,
            system_prompt=system_prompt,
            response_model=response_model,
            model_name=model_name,
            mock_fallback=mock_fallback,
        )

    def _clean_json_string(self, text: str) -> str:
        """Strip markdown codeblocks and extraneous characters."""
        text = text.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1).strip()
        return text


local_llm_client = LocalLLMClient()
