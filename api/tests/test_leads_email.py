from typing import Any

from sqlalchemy import text

from tests.conftest import FakeResend
from tests.helpers import valid_lead


def team_email(fake: FakeResend) -> dict[str, Any]:
    matches = [m for m in fake.sent if m["to"] == ["team@example.com"]]
    assert len(matches) == 1, fake.sent
    return matches[0]


def test_team_notification_has_every_detail(client: Any, fake_resend: FakeResend) -> None:
    response = client.post("/api/v1/leads", json=valid_lead())
    assert response.status_code == 201

    email = team_email(fake_resend)
    assert email["reply_to"] == "ayesha@example.com"
    body = email["text"]
    for expected in [
        "Ayesha Khan",
        "ayesha@example.com",
        "+92 300 1234567",
        "Khan Dental",
        "Pakistan",
        "Branding",
        "Digital Marketing",
        "PKR 50k–150k",
        "We need more patients from Google in Karachi.",
        "/services/seo",
    ]:
        assert expected in body, expected
    assert "Ayesha Khan" in email["subject"]


def test_visitor_text_is_escaped_in_html(client: Any, fake_resend: FakeResend) -> None:
    client.post(
        "/api/v1/leads",
        json=valid_lead(
            message='Hi <script>alert(1)</script> <a href="https://x.test">x</a> please'
        ),
    )
    html = team_email(fake_resend)["html"]
    assert "<script>" not in html
    assert '<a href="https://x.test">' not in html
    assert "&lt;script&gt;" in html


def test_email_failure_still_saves_lead_and_records_failure(
    client: Any, db: Any, fake_resend: FakeResend
) -> None:
    fake_resend.fail = True
    response = client.post("/api/v1/leads", json=valid_lead())
    assert response.status_code == 201
    assert db.execute(text("SELECT count(*) FROM leads")).scalar_one() == 1
    rows = db.execute(
        text("SELECT kind, status, error_code FROM email_deliveries ORDER BY kind")
    ).all()
    team = [r for r in rows if r.kind == "team_notification"]
    assert team and team[0].status == "failed" and team[0].error_code


def test_successful_send_is_recorded(client: Any, db: Any, fake_resend: FakeResend) -> None:
    client.post("/api/v1/leads", json=valid_lead())
    row = db.execute(
        text(
            "SELECT status, provider_message_id FROM email_deliveries "
            "WHERE kind = 'team_notification'"
        )
    ).one()
    assert row.status == "sent"
    assert row.provider_message_id


def test_repeated_submission_sends_no_more_emails(client: Any, fake_resend: FakeResend) -> None:
    payload = valid_lead()
    client.post("/api/v1/leads", json=payload)
    before = len(fake_resend.sent)
    client.post("/api/v1/leads", json=payload)
    assert len(fake_resend.sent) == before
