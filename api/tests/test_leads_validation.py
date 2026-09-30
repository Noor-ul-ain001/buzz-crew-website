from typing import Any

import pytest
from sqlalchemy import text

from tests.helpers import valid_lead


def lead_count(db: Any) -> int:
    return int(db.execute(text("SELECT count(*) FROM leads")).scalar_one())


@pytest.mark.parametrize(
    ("overrides", "field"),
    [
        ({"name": ""}, "name"),
        ({"name": "    "}, "name"),
        ({"name": "x" * 101}, "name"),
        ({"email": "not-an-email"}, "email"),
        ({"message": "too short"}, "message"),
        ({"message": "   short    "}, "message"),
        ({"message": "x" * 2001}, "message"),
        ({"phone": "abc"}, "phone"),
        ({"business": "b" * 151}, "business"),
        ({"services": []}, "services"),
        ({"services": ["branding", "branding"]}, "services"),
        ({"services": ["banana"]}, "services"),
        ({"country": "france"}, "country"),
        ({"budget_range": "millions"}, "budget_range"),
        ({"source_page": "https://evil.example/x"}, "source_page"),
    ],
)
def test_invalid_input_is_rejected_and_nothing_stored(
    client: Any, db: Any, overrides: dict[str, Any], field: str
) -> None:
    response = client.post("/api/v1/leads", json=valid_lead(**overrides))
    assert response.status_code == 422
    locs = [error["loc"] for error in response.json()["detail"]]
    assert any(field in loc for loc in locs), locs
    assert lead_count(db) == 0


def test_honeypot_filled_is_rejected(client: Any, db: Any) -> None:
    response = client.post("/api/v1/leads", json=valid_lead(website="http://spam.example"))
    assert response.status_code == 422
    assert lead_count(db) == 0


def test_valid_lead_is_stored_normalised(client: Any, db: Any) -> None:
    response = client.post(
        "/api/v1/leads",
        json=valid_lead(
            name="  Ayesha Khan  ", message="  We need more patients please.  ", phone=None
        ),
    )
    assert response.status_code == 201
    row = db.execute(
        text("SELECT name, email, phone, status, source, message, created_at FROM leads")
    ).one()
    assert row.name == "Ayesha Khan"
    assert row.email == "ayesha@example.com"
    assert row.phone is None
    assert row.status == "new"
    assert row.source == "contact_form"
    assert row.message == "We need more patients please."
    assert row.created_at is not None
