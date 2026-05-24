from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    env: str = "dev"
    cors_origins: list[str] = ["http://localhost:3000"]
    database_url: str = "postgresql://qa:qa@localhost:5432/qa"
    redis_url: str = "redis://localhost:6379/0"
    anthropic_api_key: str | None = None
    clerk_jwks_url: str | None = None
    polygon_api_key: str | None = None
    alpha_vantage_api_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_prefix="QA_", extra="ignore")


settings = Settings()
