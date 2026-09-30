from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Required values have no default, so startup fails fast."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str
    database_url_direct: str | None = None
    test_database_url: str | None = None

    # Comma-separated list of web origins (CORS allowlist and CSRF Origin check).
    client_url: str

    resend_api_key: str
    email_from: str
    team_notification_email: str
    email_timeout_seconds: float = 5.0
    # "fake" skips the provider entirely (local development and end-to-end tests).
    email_provider: Literal["resend", "fake"] = "resend"
    # International format, digits only, as wa.me requires.
    whatsapp_number: str = "923147971082"

    ip_hash_salt: str = Field(min_length=8)
    cron_secret: str | None = None

    # Admin sign-in (feature 003)
    session_cookie_name: str = "bc_session"
    # Always true in deployed environments; tests over plain http set it to false.
    session_cookie_secure: bool = True
    session_idle_minutes: int = 30
    session_max_hours: int = 12
    hibp_enabled: bool = False
    hibp_timeout_seconds: float = 2.0
    # Public web origin used in emailed links (invitations, password resets).
    web_url: str = "http://localhost:3000"
    # Staff sign-up at /admin/signup: anyone holding this code can create an editor account.
    # Unset disables sign-up entirely, leaving invitations as the only way in.
    admin_signup_code: str | None = Field(default=None, min_length=12)

    # Content publishing (feature 004). Uploads go straight to Cloudinary (free plan).
    cloudinary_url: str | None = None
    cloudinary_folder: str = "buzzcrew"
    # Shared with the web app's /api/revalidate route (HMAC-SHA256 over the body).
    revalidate_secret: str | None = None
    revalidate_timeout_seconds: float = 3.0

    @property
    def whatsapp_url(self) -> str:
        return f"https://wa.me/{self.whatsapp_number}"

    @property
    def client_origins(self) -> list[str]:
        return [
            origin.strip().rstrip("/") for origin in self.client_url.split(",") if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # pyright: ignore[reportCallIssue]
