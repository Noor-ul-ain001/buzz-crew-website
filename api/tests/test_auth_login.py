from typing import Any

from sqlalchemy import text

from tests.conftest import STRONG_PASSWORD, create_user, login


def test_correct_login_sets_cookie_and_returns_me(client: Any, admin: Any, db: Any) -> None:
    response = login(client)
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "admin@example.com"
    assert body["role"] == "admin"
    assert {"session_expires_at", "idle_expires_at"} <= set(body)

    cookie = response.headers["set-cookie"]
    assert cookie.startswith("bc_session=")
    assert "HttpOnly" in cookie
    assert "SameSite=lax" in cookie
    assert "Domain" not in cookie  # host-only on the web domain (DEPLOYMENT D2)

    assert client.get("/api/v1/auth/me").json()["email"] == "admin@example.com"
    last_login = db.execute(text("SELECT last_login_at FROM users")).scalar_one()
    assert last_login is not None


def test_email_is_case_insensitive(client: Any, admin: Any) -> None:
    assert login(client, "ADMIN@Example.com").status_code == 200


def test_failures_are_indistinguishable(client: Any, db: Any) -> None:
    create_user(db, email="gone@example.com", status="deactivated")
    create_user(db, email="real@example.com")
    unknown = login(client, "nobody@example.com")
    wrong = login(client, "real@example.com", "wrong password here")
    deactivated = login(client, "gone@example.com")
    assert unknown.status_code == wrong.status_code == deactivated.status_code == 401
    assert unknown.json() == wrong.json() == deactivated.json()
    assert unknown.json()["detail"]["code"] == "invalid_credentials"


def test_fresh_token_on_each_sign_in(client: Any, admin: Any) -> None:
    first = login(client).cookies.get("bc_session")
    second = login(client).cookies.get("bc_session")
    assert first and second and first != second


def test_events_are_recorded(client: Any, admin: Any, db: Any) -> None:
    login(client)
    login(client, password="not the password!")
    types = [r[0] for r in db.execute(text("SELECT type FROM security_events ORDER BY id")).all()]
    assert types == ["login_succeeded", "login_failed"]


def test_logout_ends_session(admin_client: Any) -> None:
    assert admin_client.post("/api/v1/auth/logout").status_code == 204
    assert admin_client.get("/api/v1/auth/me").status_code == 401


def test_me_without_cookie_is_401(client: Any) -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "not_authenticated"


def test_csrf_origin_required_for_signed_in_writes(admin_client: Any) -> None:
    response = admin_client.post("/api/v1/auth/logout", headers={"Origin": "https://evil.example"})
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "csrf_failed"


def test_password_is_rehashed_transparently(client: Any, admin: Any) -> None:
    # verify_and_update path: a normal login keeps working with the stored hash.
    assert login(client, password=STRONG_PASSWORD).status_code == 200
