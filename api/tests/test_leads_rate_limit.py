from typing import Any

from sqlalchemy import text

from tests.helpers import valid_lead


def post_from(client: Any, ip: str) -> Any:
    return client.post("/api/v1/leads", json=valid_lead(), headers={"X-Forwarded-For": ip})


def test_sixth_submission_in_an_hour_is_rejected(client: Any, db: Any) -> None:
    for _ in range(5):
        assert post_from(client, "203.0.113.5").status_code == 201

    response = post_from(client, "203.0.113.5")
    assert response.status_code == 429
    assert response.json()["detail"] == {
        "code": "rate_limited",
        "message": "Too many attempts, please try again later.",
    }
    assert int(response.headers["Retry-After"]) > 0
    assert db.execute(text("SELECT count(*) FROM leads")).scalar_one() == 5


def test_other_visitors_are_unaffected(client: Any) -> None:
    for _ in range(6):
        post_from(client, "203.0.113.5")
    assert post_from(client, "198.51.100.7").status_code == 201
