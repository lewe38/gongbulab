"""Centralized settings — loaded from environment (.env at the repo root in dev)."""
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# /api/app/config.py → /api/app → /api → repo root
REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ─── Gemini ─────────────────────────────────────
    gemini_api_key: str = Field(default="", description="Google AI Studio API key")
    gemini_model_extraction: str = "gemini-3.1-pro-preview"
    gemini_model_validation: str = "gemini-2.5-flash"
    gemini_model_chatbot: str = "gemini-2.5-flash"

    # ─── Supabase ───────────────────────────────────
    next_public_supabase_url: str = "http://localhost:54321"
    next_public_supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # ─── API ────────────────────────────────────────
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
