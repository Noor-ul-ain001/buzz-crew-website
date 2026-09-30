from concurrent.futures import ThreadPoolExecutor
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.main import app
from tests.conftest import create_user, login


def other_client() -> TestClient:
    return TestClient(app, headers={"Origin": "http://localhost:3000"})


def test_list_users(admin_client: Any, editor: Any) -> None:
    users = admin_client.get("/api/v1/users").json()
    assert {u["email"] for u in users} == {"admin@example.com", "editor@example.com"}
    assert {"status", "role", "last_login_at"} <= set(users[0])


def test_role_change_applies_on_next_request(admin_client: Any, editor: Any) -> None:
    with other_client() as editor_session:
        login(editor_session, "editor@example.com")
        assert editor_session.get("/api/v1/users").status_code == 403
        response = admin_client.patch(f"/api/v1/users/{editor.id}", json={"role": "admin"})
        assert response.status_code == 200
        assert editor_session.get("/api/v1/users").status_code == 200


def test_deactivation_ends_every_session(admin_client: Any, editor: Any, db: Any) -> None:
    with other_client() as a, other_client() as b:
        login(a, "editor@example.com")
        login(b, "editor@example.com")
        response = admin_client.patch(f"/api/v1/users/{editor.id}", json={"status": "deactivated"})
        assert response.status_code == 200
        assert a.get("/api/v1/auth/me").status_code == 401
        assert b.get("/api/v1/auth/me").status_code == 401
        assert login(a, "editor@example.com").status_code == 401
    reasons = {
        r[0]
        for r in db.execute(
            text("SELECT end_reason FROM sessions WHERE user_id=:u"), {"u": editor.id}
        )
    }
    assert reasons == {"deactivated"}


def test_reactivation(admin_client: Any, editor: Any) -> None:
    admin_client.patch(f"/api/v1/users/{editor.id}", json={"status": "deactivated"})
    admin_client.patch(f"/api/v1/users/{editor.id}", json={"status": "active"})
    with other_client() as c:
        assert login(c, "editor@example.com").status_code == 200


def test_last_admin_cannot_be_removed(admin_client: Any, admin: Any) -> None:
    demote = admin_client.patch(f"/api/v1/users/{admin.id}", json={"role": "editor"})
    assert demote.status_code == 409
    assert demote.json()["detail"]["code"] == "last_admin"
    deactivate = admin_client.patch(f"/api/v1/users/{admin.id}", json={"status": "deactivated"})
    assert deactivate.status_code == 409


def test_last_admin_guard_holds_under_concurrency(admin_client: Any, db: Any) -> None:
    second = create_user(db, email="second@example.com", role="admin")
    first_id = admin_client.get("/api/v1/auth/me").json()["id"]
    with other_client() as other:
        login(other, "second@example.com")

        def demote(client: Any, user_id: Any) -> int:
            return client.patch(f"/api/v1/users/{user_id}", json={"role": "editor"}).status_code

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(
                pool.map(lambda args: demote(*args), [(admin_client, second.id), (other, first_id)])
            )
    active_admins = db.execute(
        text("SELECT count(*) FROM users WHERE role='admin' AND status='active'")
    ).scalar_one()
    assert active_admins >= 1
    assert sorted(results) in ([200, 409], [200, 401], [200, 403])


def test_role_change_is_recorded(admin_client: Any, editor: Any, db: Any) -> None:
    admin_client.patch(f"/api/v1/users/{editor.id}", json={"role": "admin"})
    row = db.execute(text("SELECT detail FROM security_events WHERE type='role_changed'")).one()
    assert row.detail == {"from_role": "editor", "to_role": "admin"}
