from typing import Any

import pytest
from sqlalchemy import text

from app.core.config import get_settings
from tests.conftest import create_user

CODE = "crew-signup-code-2026"
PASSWORD = "a sturdy new passphrase 42"


def signup(client: Any, **overrides: str) -> Any:
    body = {"name": "Sana Iqbal", "email": "Sana@Example.com", "password": PASSWORD, "code": CODE}
    body.update(overrides)
    return client.post("/api/v1/auth/signup", json=body)


def test_signup_creates_a_signed_in_editor(client: Any, db: Any) -> None:
    response = signup(client)
    assert response.status_code == 201
    assert response.json()["role"] == "editor"
    assert client.get("/api/v1/auth/me").json()["email"] == "sana@example.com"
    row = db.execute(text("SELECT role, status FROM users WHERE email='sana@example.com'")).one()
    assert tuple(row) == ("editor", "active")
    event = db.execute(text("SELECT count(*) FROM security_events WHERE type='signed_up'"))
    assert event.scalar_one() == 1


def test_wrong_code_is_refused(client: Any, db: Any) -> None:
    response = signup(client, code="not-the-code")
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "invalid_signup_code"
    assert db.execute(text("SELECT count(*) FROM users")).scalar_one() == 0


def test_existing_email_is_refused(client: Any, db: Any) -> None:
    create_user(db, email="sana@example.com")
    response = signup(client)
    assert response.status_code == 409


def test_weak_password_is_refused(client: Any) -> None:
    response = signup(client, password="short")
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "weak_password"


def test_attempts_are_rate_limited(client: Any) -> None:
    for _ in range(5):
        assert signup(client, code="wrong-code").status_code == 403
    assert signup(client).status_code == 429


def test_signup_is_closed_without_a_code(client: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(get_settings(), "admin_signup_code", None)
    response = signup(client)
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "signup_disabled"
