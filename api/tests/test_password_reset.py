import re
from typing import Any

from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import STRONG_PASSWORD, Clock, FakeResend, create_user, login

NEW_PASSWORD = "brand new passphrase 2026"


def reset_token(fake: FakeResend) -> str:
    match = re.search(r"token=([A-Za-z0-9_\-]+)", fake.sent[-1]["text"])
    assert match
    return match.group(1)


def request_reset(client: Any, email: str) -> Any:
    return client.post("/api/v1/auth/password-reset/request", json={"email": email})


def test_same_response_whether_or_not_account_exists(
    client: Any, admin: Any, fake_resend: FakeResend
) -> None:
    known = request_reset(client, "admin@example.com")
    unknown = request_reset(client, "nobody@example.com")
    assert known.status_code == unknown.status_code == 202
    assert known.json() == unknown.json()
    assert len(fake_resend.sent) == 1


def test_no_email_for_deactivated_account(client: Any, db: Any, fake_resend: FakeResend) -> None:
    create_user(db, email="gone@example.com", status="deactivated")
    assert request_reset(client, "gone@example.com").status_code == 202
    assert fake_resend.sent == []


def test_reset_flow(client: Any, admin: Any, fake_resend: FakeResend) -> None:
    with TestClient(app, headers={"Origin": "http://localhost:3000"}) as other:
        login(other)
        request_reset(client, "admin@example.com")
        token = reset_token(fake_resend)
        assert STRONG_PASSWORD not in fake_resend.sent[-1]["text"]  # links only, never passwords

        confirm = client.post(
            "/api/v1/auth/password-reset/confirm", json={"token": token, "password": NEW_PASSWORD}
        )
        assert confirm.status_code == 204
        assert other.get("/api/v1/auth/me").status_code == 401  # other sessions ended
    assert login(client, password=STRONG_PASSWORD).status_code == 401
    assert login(client, password=NEW_PASSWORD).status_code == 200
    assert "changed" in fake_resend.sent[-1]["subject"].lower()

    again = client.post(
        "/api/v1/auth/password-reset/confirm", json={"token": token, "password": NEW_PASSWORD}
    )
    assert again.status_code == 400


def test_link_expires_after_an_hour(
    client: Any, admin: Any, fake_resend: FakeResend, clock: Clock
) -> None:
    request_reset(client, "admin@example.com")
    token = reset_token(fake_resend)
    clock.advance(hours=1, minutes=1)
    response = client.post(
        "/api/v1/auth/password-reset/confirm", json={"token": token, "password": NEW_PASSWORD}
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_or_expired_token"


def test_newer_request_invalidates_older_link(
    client: Any, admin: Any, fake_resend: FakeResend
) -> None:
    request_reset(client, "admin@example.com")
    first = reset_token(fake_resend)
    request_reset(client, "admin@example.com")
    response = client.post(
        "/api/v1/auth/password-reset/confirm", json={"token": first, "password": NEW_PASSWORD}
    )
    assert response.status_code == 400


def test_weak_password_refused(client: Any, admin: Any, fake_resend: FakeResend) -> None:
    request_reset(client, "admin@example.com")
    token = reset_token(fake_resend)
    response = client.post(
        "/api/v1/auth/password-reset/confirm", json={"token": token, "password": "password12345"}
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "weak_password"


def test_requests_limited_per_email(client: Any, admin: Any) -> None:
    for _ in range(5):
        assert request_reset(client, "admin@example.com").status_code == 202
    assert request_reset(client, "admin@example.com").status_code == 429


def test_change_password(admin_client: Any, fake_resend: FakeResend) -> None:
    response = admin_client.post(
        "/api/v1/auth/password/change",
        json={"current_password": STRONG_PASSWORD, "new_password": NEW_PASSWORD},
    )
    assert response.status_code == 204
    assert admin_client.get("/api/v1/auth/me").status_code == 200  # this session stays
    wrong = admin_client.post(
        "/api/v1/auth/password/change",
        json={"current_password": "wrong one entirely", "new_password": NEW_PASSWORD + "x"},
    )
    assert wrong.status_code == 400
