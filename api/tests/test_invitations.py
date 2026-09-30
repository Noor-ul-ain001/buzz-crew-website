import re
from typing import Any

from sqlalchemy import text

from tests.conftest import Clock, FakeResend, login

NEW_PASSWORD = "a sturdy new passphrase 42"


def token_from(fake: FakeResend, to: str) -> str:
    emails = [m for m in fake.sent if m["to"] == [to]]
    assert emails, fake.sent
    match = re.search(r"token=([A-Za-z0-9_\-]+)", emails[-1]["text"])
    assert match
    return match.group(1)


def invite(client: Any, email: str = "new@example.com", role: str = "editor") -> Any:
    return client.post(
        "/api/v1/invitations", json={"email": email, "name": "New Person", "role": role}
    )


def test_invite_then_accept(admin_client: Any, fake_resend: FakeResend, db: Any) -> None:
    response = invite(admin_client)
    assert response.status_code == 201
    assert response.json()["status"] == "invited"

    token = token_from(fake_resend, "new@example.com")
    admin_client.post("/api/v1/auth/logout")
    accepted = admin_client.post(
        "/api/v1/invitations/accept", json={"token": token, "password": NEW_PASSWORD}
    )
    assert accepted.status_code == 200
    assert accepted.json()["role"] == "editor"
    assert admin_client.get("/api/v1/auth/me").json()["email"] == "new@example.com"
    status = db.execute(text("SELECT status FROM users WHERE email='new@example.com'")).scalar()
    assert status == "active"


def test_link_is_single_use(admin_client: Any, fake_resend: FakeResend) -> None:
    invite(admin_client)
    token = token_from(fake_resend, "new@example.com")
    body = {"token": token, "password": NEW_PASSWORD}
    assert admin_client.post("/api/v1/invitations/accept", json=body).status_code == 200
    again = admin_client.post("/api/v1/invitations/accept", json=body)
    assert again.status_code == 400
    assert again.json()["detail"]["code"] == "invalid_or_expired_token"


def test_link_expires_after_72_hours(
    admin_client: Any, fake_resend: FakeResend, clock: Clock
) -> None:
    login(admin_client)  # re-login under the frozen clock
    invite(admin_client)
    token = token_from(fake_resend, "new@example.com")
    clock.advance(hours=72, minutes=1)
    response = admin_client.post(
        "/api/v1/invitations/accept", json={"token": token, "password": NEW_PASSWORD}
    )
    assert response.status_code == 400


def test_weak_password_is_refused(admin_client: Any, fake_resend: FakeResend) -> None:
    invite(admin_client)
    token = token_from(fake_resend, "new@example.com")
    for weak in ["short", "password1234", "new@example.com-1234"]:
        response = admin_client.post(
            "/api/v1/invitations/accept", json={"token": token, "password": weak}
        )
        assert response.status_code in (400, 422), weak


def test_resend_cancels_previous_link(admin_client: Any, fake_resend: FakeResend) -> None:
    user_id = invite(admin_client).json()["id"]
    first = token_from(fake_resend, "new@example.com")
    assert admin_client.post(f"/api/v1/users/{user_id}/invitation").status_code == 202
    second = token_from(fake_resend, "new@example.com")
    assert first != second
    old = admin_client.post(
        "/api/v1/invitations/accept", json={"token": first, "password": NEW_PASSWORD}
    )
    assert old.status_code == 400


def test_cancel_invitation(admin_client: Any, fake_resend: FakeResend) -> None:
    user_id = invite(admin_client).json()["id"]
    token = token_from(fake_resend, "new@example.com")
    assert admin_client.delete(f"/api/v1/users/{user_id}/invitation").status_code == 204
    response = admin_client.post(
        "/api/v1/invitations/accept", json={"token": token, "password": NEW_PASSWORD}
    )
    assert response.status_code == 400


def test_existing_email_is_refused_case_insensitively(admin_client: Any) -> None:
    response = invite(admin_client, email="ADMIN@example.com")
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "user_exists"
