"""
Centralized application configuration.

Why this file exists:
Every piece of config (API keys, DB URL, CORS origins) flows through this
single `Settings` object instead of being read ad-hoc via `os.environ.get()`
scattered across the codebase. This gives us three things:

1. Type safety  - settings are validated at startup, not at first use.
   A missing GEMINI_API_KEY fails immediately on boot with a clear error,
   not three hours into a hackathon demo when someone opens the chat tab.
2. Single source of truth - any dev can open this file and see every
   config value the app depends on, instead of grepping for os.environ.
3. Easy testing - tests can construct a Settings object with overrides
   instead of mutating process-wide environment variables.

Usage elsewhere in the app:
    from app.core.config import settings
    settings.GEMINI_API_KEY
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- App ---
    APP_ENV: str = "development"
    DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:3000"

    # --- Database ---
    DATABASE_URL: str = "sqlite+aiosqlite:///./disaster_os.db"

    # --- Firebase ---
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "./firebase-service-account.json"
    FIREBASE_PROJECT_ID: str

    # --- Gemini AI ---
    GEMINI_API_KEY: str
    GEMINI_TEXT_MODEL: str = "gemini-2.0-flash"
    GEMINI_VISION_MODEL: str = "gemini-2.0-flash"

    # --- Google Maps (server-side key, different from frontend's browser key) ---
    GOOGLE_MAPS_SERVER_API_KEY: str

    # --- OpenWeather ---
    OPENWEATHER_API_KEY: str

    # --- ReliefWeb ---
    RELIEFWEB_APP_NAME: str = "disaster-os-hackathon"

    # --- NASA FIRMS (optional feature - allowed to be empty) ---
    NASA_FIRMS_API_KEY: str = ""

    # --- Admin access for SOS management ---
    # Comma-separated Firebase UIDs that have admin access to the SOS
    # management panel. Get your UID from Firebase Console > Authentication
    # > Users, or from the decoded ID token in a backend log after signing in.
    # Empty string means NO admin access is configured (SOS admin panel
    # will be inaccessible until at least one UID is added).
    ADMIN_UIDS: str = ""

    @field_validator("CORS_ORIGINS")
    @classmethod
    def _validate_cors(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("CORS_ORIGINS must not be empty")
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS_ORIGINS is stored as a comma-separated string in .env for
        readability, but FastAPI's CORSMiddleware wants a list. This
        property does the split once, on access."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def admin_uids_set(self) -> set[str]:
        """ADMIN_UIDS as a set for O(1) membership checks in
        app/core/admin.py's require_admin dependency."""
        return {uid.strip() for uid in self.ADMIN_UIDS.split(",") if uid.strip()}

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached so Settings() - which reads the .env file from disk - only
    runs once per process, not on every import."""
    return Settings()


settings = get_settings()
