"""
Pydantic Settings — loads all Railway environment variables.
See PYTHON_BACKEND_ARCHITECTURE.md Section 10 for the full list.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- App ---
    app_name: str = "CapeTown GIS Hub API"
    app_version: str = "0.1.0"
    debug: bool = False
    log_level: str = "INFO"

    # --- Supabase ---
    supabase_url: str = "https://localhost:54321"
    supabase_service_role_key: str = ""

    # --- Database (async — GeoAlchemy2 + asyncpg) ---
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/capegis"

    # --- Celery + Redis ---
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"

    # --- Cloudflare R2 ---
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "capegis-rasters"

    # --- ML ---
    huggingface_token: str = ""
    anthropic_api_key: str = ""

    # --- Google Earth Engine ---
    gee_service_account: str = ""
    gee_private_key: str = ""

    # --- Observability ---
    sentry_dsn: str = ""

    # --- Security / CORS ---
    allowed_origins: str = "https://capegis.vercel.app"

    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated ALLOWED_ORIGINS into a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def supabase_jwks_url(self) -> str:
        """Derive the JWKS endpoint from the Supabase project URL."""
        base = self.supabase_url.rstrip("/")
        return f"{base}/auth/v1/.well-known/jwks.json"


settings = Settings()
