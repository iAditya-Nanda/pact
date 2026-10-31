import os
from pathlib import Path
from pydantic import BaseModel, Field

DEFAULT_MODEL_PATH = str(
    Path(__file__).resolve().parent.parent.parent
    / "models"
    / "qwen2.5-3b-instruct-q4_k_m.gguf"
)


class EngineConfig(BaseModel):
    # Pure C++ llama.cpp GGUF Model Path
    model_path: str = Field(
        default=os.getenv("LLAMA_MODEL_PATH", DEFAULT_MODEL_PATH),
        description="Local pure C++ GGUF model path for in-process llama.cpp inference",
    )
    # Tier A: Fast Extraction & Classification
    tier_a_model: str = Field(
        default=os.getenv("TIER_A_MODEL", "qwen2.5-3b-instruct"),
        description="Fast local model for intent classification and entity parsing",
    )
    # Tier B: Deep Planning & Multi-Step Reasoning
    tier_b_model: str = Field(
        default=os.getenv("TIER_B_MODEL", "qwen2.5-3b-instruct"),
        description="Local reasoning model for DAG synthesis and conflict evaluation",
    )
    n_gpu_layers: int = Field(
        default=int(os.getenv("LLAMA_GPU_LAYERS", "-1")),
        description="Number of layers to offload to Apple Silicon Metal GPU (-1 = all)",
    )
    n_ctx: int = Field(
        default=int(os.getenv("LLAMA_CTX_SIZE", "4096")),
        description="Context window token size for llama.cpp",
    )
    temperature: float = Field(
        default=0.1,
        description="Low temperature for deterministic structured outputs",
    )


engine_config = EngineConfig()
