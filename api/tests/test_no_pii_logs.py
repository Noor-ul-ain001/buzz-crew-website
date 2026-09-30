"""Constitution Principle V: no names, emails, phones or messages in logs."""

from typing import Any

import pytest

from tests.conftest import FakeResend
from tests.helpers import valid_lead

PERSONAL_VALUES = [
    "Ayesha Khan",
    "ayesha@example.com",
    "Ayesha@Example.com",
    "+92 300 1234567",
    "We need more patients from Google in Karachi.",
    "Khan Dental",
]


def assert_no_personal_data(output: str) -> None:
    for value in PERSONAL_VALUES:
        assert value not in output, f"{value!r} leaked into logs"


def test_successful_submission_logs_no_personal_data(
    client: Any, capsys: pytest.CaptureFixture[str]
) -> None:
    client.post("/api/v1/leads", json=valid_lead())
    output = capsys.readouterr().out
    assert "lead_created" in output
    assert "email_delivery" in output
    assert_no_personal_data(output)


def test_failed_email_logs_no_personal_data(
    client: Any, fake_resend: FakeResend, capsys: pytest.CaptureFixture[str]
) -> None:
    fake_resend.fail = True
    client.post("/api/v1/leads", json=valid_lead())
    assert_no_personal_data(capsys.readouterr().out)


def test_rejected_submission_logs_no_personal_data(
    client: Any, capsys: pytest.CaptureFixture[str]
) -> None:
    client.post("/api/v1/leads", json=valid_lead(message="short"))
    assert_no_personal_data(capsys.readouterr().out)
