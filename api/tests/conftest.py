"""Test fixtures.

A real Postgres is used (enum arrays, ON CONFLICT). When TEST_DATABASE_URL is not set, a
throwaway local server is started with pgserver. Third-party services (Resend)
are always faked (constitution Principle IV).
"""

import os
from collections.abc import Iterator
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

API_DIR = Path(__file__).resolve().parents[1]


def _start_database() -> tuple[str, Any]:
    url = os.environ.get("TEST_DATABASE_URL")
    if url:
        return url, None
    import pgserver  # pyright: ignore[reportMissingImports]

    server = pgserver.get_server(str(API_DIR / ".pgdata"), cleanup_mode="stop")
    server.psql("DROP DATABASE IF EXISTS buzzcrew_test;")
    server.psql("CREATE DATABASE buzzcrew_test;")
    base = server.get_uri().rsplit("/", 1)[0]
    return f"{base}/buzzcrew_test", server


_DB_URL, _SERVER = _start_database()

# Settings must exist before the app is imported.
os.environ.update(
    {
        "DATABASE_URL": _DB_URL,
        "DATABASE_URL_DIRECT": _DB_URL,
        "CLIENT_URL": "http://localhost:3000",
        "RESEND_API_KEY": "re_test",
        "EMAIL_FROM": "The Buzz Crew <hello@example.com>",
        "TEAM_NOTIFICATION_EMAIL": "team@example.com",
        "IP_HASH_SALT": "test-salt-123456",
        "ADMIN_SIGNUP_CODE": "crew-signup-code-2026",
        "CRON_SECRET": "test-cron",
        # TestClient talks plain http, so Secure cookies would never be sent back.
        "SESSION_COOKIE_SECURE": "false",
        "WEB_URL": "http://localhost:3000",
    }
)


@pytest.fixture(scope="session", autouse=True)
def _migrated_database() -> Iterator[None]:
    from alembic.config import Config

    from alembic import command

    cfg = Config(str(API_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(API_DIR / "alembic"))
    command.upgrade(cfg, "head")
    yield
    if _SERVER is not None:
        _SERVER.cleanup()


@pytest.fixture(autouse=True)
def _clean_tables() -> Iterator[None]:
    yield
    from sqlalchemy import text
    from sqlmodel import SQLModel

    from app.core.database import get_engine

    tables = [t.name for t in SQLModel.metadata.sorted_tables]
    if tables:
        with get_engine().begin() as conn:
            conn.execute(text(f"TRUNCATE {', '.join(tables)} CASCADE"))


@pytest.fixture
def client() -> Iterator[Any]:
    from fastapi.testclient import TestClient

    from app.main import app

    # Browsers send Origin on writes; the CSRF check requires it for signed-in requests.
    with TestClient(app, headers={"Origin": "http://localhost:3000"}) as test_client:
        yield test_client


@pytest.fixture
def db() -> Iterator[Any]:
    from sqlmodel import Session

    from app.core.database import get_engine

    with Session(get_engine()) as session:
        yield session


@dataclass
class FakeResend:
    """Captures outgoing emails instead of calling Resend."""

    sent: list[dict[str, Any]] = field(default_factory=list)
    fail: bool = False

    def deliver(self, params: dict[str, Any]) -> str:
        if self.fail:
            raise RuntimeError("provider_error")
        self.sent.append(params)
        return f"msg_{len(self.sent)}"


@pytest.fixture(autouse=True)
def fake_resend(monkeypatch: pytest.MonkeyPatch) -> FakeResend:
    fake = FakeResend()
    monkeypatch.setattr("app.services.email_service._deliver", fake.deliver)
    return fake


@dataclass
class FakeMediaStore:
    """Stands in for Cloudinary. Tests put "uploaded" bytes in `tmp` before finalizing."""

    tmp: dict[str, bytes] = field(default_factory=dict)
    stored: dict[str, bytes] = field(default_factory=dict)
    deleted: list[str] = field(default_factory=list)

    def sign(self, folder: str, public_id: str) -> dict[str, Any]:
        return {"folder": folder, "public_id": public_id, "signature": "sig", "timestamp": 1}

    def download(self, public_id: str) -> bytes:
        return self.tmp[public_id]

    def upload(self, data: bytes, folder: str, public_id: str) -> str:
        self.stored[f"{folder}/{public_id}"] = data
        return f"https://res.cloudinary.com/demo/image/upload/v1/{folder}/{public_id}"

    def delete(self, public_id: str) -> None:
        self.deleted.append(public_id)
        self.tmp.pop(public_id, None)
        self.stored.pop(public_id, None)

    def delete_older_than(self, prefix: str, cutoff: datetime) -> int:
        stale = [key for key in self.tmp if key.startswith(prefix)]
        for key in stale:
            self.delete(key)
        return len(stale)


@pytest.fixture(autouse=True)
def media_store() -> Iterator[FakeMediaStore]:
    from app.services import media_store as module

    fake = FakeMediaStore()
    module.set_store(fake)
    yield fake
    module.set_store(None)


@dataclass
class FakeRevalidation:
    tags: list[list[str]] = field(default_factory=list)

    def revalidate(self, tags: list[str]) -> None:
        self.tags.append(sorted(tags))


@pytest.fixture(autouse=True)
def revalidations(monkeypatch: pytest.MonkeyPatch) -> FakeRevalidation:
    fake = FakeRevalidation()
    monkeypatch.setattr("app.services.revalidation.revalidate", fake.revalidate)
    return fake


@dataclass
class Clock:
    """Controllable time for session and lockout tests."""

    current: datetime

    def now(self) -> datetime:
        return self.current

    def advance(self, **delta: float) -> None:
        self.current = self.current + timedelta(**delta)


@pytest.fixture
def clock(monkeypatch: pytest.MonkeyPatch) -> Clock:
    fake = Clock(current=datetime(2026, 9, 28, 9, 0, tzinfo=UTC))
    monkeypatch.setattr("app.core.clock.now", fake.now)
    return fake


STRONG_PASSWORD = "correct horse battery staple"


def create_user(
    db: Any,
    *,
    email: str = "admin@example.com",
    name: str = "Admin Person",
    role: str = "admin",
    status: str = "active",
    password: str | None = STRONG_PASSWORD,
) -> Any:
    from app.core.security import hash_password
    from app.models.user import User, UserRole, UserStatus

    user = User(
        email=email.lower(),
        name=name,
        role=UserRole(role),
        status=UserStatus(status),
        password_hash=hash_password(password) if password else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login(client: Any, email: str = "admin@example.com", password: str = STRONG_PASSWORD) -> Any:
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


@pytest.fixture
def admin(db: Any) -> Any:
    return create_user(db)


@pytest.fixture
def editor(db: Any) -> Any:
    return create_user(db, email="editor@example.com", name="Editor Person", role="editor")


@pytest.fixture
def admin_client(client: Any, admin: Any) -> Any:
    assert login(client).status_code == 200
    return client


@pytest.fixture
def editor_client(client: Any, editor: Any) -> Any:
    assert login(client, "editor@example.com").status_code == 200
    return client
