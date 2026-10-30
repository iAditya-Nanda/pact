import os
from pydantic import BaseModel, Field


class EngineConfig(BaseModel):
    ollama_base_url: str = Field(
        default=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        description="Local C++ Ollama / llama.cpp API base URL"
    )
    # Tier A: Fast Extraction & Classification
    tier_a_model: str = Field(
        default=os.getenv("TIER_A_MODEL", "qwen2.5:3b"),
        description="Fast local model for intent classification and entity parsing"
    )
    # Tier B: Deep Planning & Multi-Step Reasoning
    tier_b_model: str = Field(
        default=os.getenv("TIER_B_MODEL", "qwen2.5:3b"),
        description="Local reasoning model for DAG synthesis and conflict evaluation"
    )
    request_timeout: float = Field(default=30.0, description="HTTP timeout in seconds")
    temperature: float = Field(default=0.1, description="Low temperature for deterministic structured outputs")


engine_config = EngineConfig()
