from typing import Any

from sqlalchemy import text

from tests.conftest import Clock, login


def test_idle_timeout(client: Any, admin: Any, clock: Clock, db: Any) -> None:
    login(client)
    clock.advance(minutes=29)
    assert client.get("/api/v1/auth/me").status_code == 200  # activity resets the idle timer
    clock.advance(minutes=31)
    assert client.get("/api/v1/auth/me").status_code == 401
    reason = db.execute(text("SELECT end_reason FROM sessions")).scalar_one()
    assert reason == "idle"


def test_extend_resets_idle_but_not_max_age(client: Any, admin: Any, clock: Clock, db: Any) -> None:
    login(client)
    for _ in range(25):  # 25 × 29 min > 12 h, always active
        clock.advance(minutes=29)
        response = client.post("/api/v1/auth/session/extend")
        if response.status_code == 401:
            break
    assert response.status_code == 401
    assert db.execute(text("SELECT end_reason FROM sessions")).scalar_one() == "max_age"


def test_logout_on_one_device_keeps_the_other(client: Any, admin: Any) -> None:
    from fastapi.testclient import TestClient

    from app.main import app

    login(client)
    with TestClient(app, headers={"Origin": "http://localhost:3000"}) as other:
        login(other)
        client.post("/api/v1/auth/logout")
        assert client.get("/api/v1/auth/me").status_code == 401
        assert other.get("/api/v1/auth/me").status_code == 200
