from typing import Any

from sqlalchemy import text

from tests.conftest import FakeResend
from tests.helpers import valid_lead


def confirmation(fake: FakeResend) -> dict[str, Any]:
    matches = [m for m in fake.sent if m["to"] == ["ayesha@example.com"]]
    assert len(matches) == 1, fake.sent
    return matches[0]


def test_confirmation_restates_the_request(client: Any, fake_resend: FakeResend) -> None:
    client.post("/api/v1/leads", json=valid_lead())
    email = confirmation(fake_resend)
    body = email["text"]
    for expected in [
        "Branding",
        "Digital Marketing",
        "PKR 50k–150k",
        "Pakistan",
        "We need more patients from Google in Karachi.",
        "within 24 hours",
        "team@example.com",
    ]:
        assert expected in body, expected
    assert "reply_to" not in email


def test_both_emails_are_sent(client: Any, fake_resend: FakeResend) -> None:
    client.post("/api/v1/leads", json=valid_lead())
    recipients = sorted(m["to"][0] for m in fake_resend.sent)
    assert recipients == ["ayesha@example.com", "team@example.com"]


def test_confirmation_failure_is_recorded(client: Any, db: Any, fake_resend: FakeResend) -> None:
    fake_resend.fail = True
    response = client.post("/api/v1/leads", json=valid_lead())
    assert response.status_code == 201
    row = db.execute(
        text("SELECT status FROM email_deliveries WHERE kind = 'client_confirmation'")
    ).one()
    assert row.status == "failed"
