from typing import Any

from sqlalchemy import text

from tests.helpers import valid_lead


def test_same_idempotency_key_returns_same_lead(client: Any, db: Any) -> None:
    payload = valid_lead()
    first = client.post("/api/v1/leads", json=payload)
    second = client.post("/api/v1/leads", json=payload)
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]
    assert db.execute(text("SELECT count(*) FROM leads")).scalar_one() == 1


def test_different_keys_create_separate_leads(client: Any, db: Any) -> None:
    client.post("/api/v1/leads", json=valid_lead())
    client.post("/api/v1/leads", json=valid_lead())
    assert db.execute(text("SELECT count(*) FROM leads")).scalar_one() == 2
