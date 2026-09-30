import re
from typing import Any

import pytest
from sqlalchemy import text

from tests.conftest import STRONG_PASSWORD, FakeResend, login


def test_no_passwords_tokens_or_links_in_logs_or_events(
    client: Any, admin: Any, db: Any, fake_resend: FakeResend, capsys: pytest.CaptureFixture[str]
) -> None:
    login(client)
    login(client, password="wrong password value")
    client.post(
        "/api/v1/invitations", json={"email": "n@example.com", "name": "N", "role": "editor"}
    )
    client.post("/api/v1/auth/password-reset/request", json={"email": "admin@example.com"})

    tokens = [
        m.group(1)
        for email in fake_resend.sent
        if (m := re.search(r"token=([A-Za-z0-9_\-]+)", email["text"]))
    ]
    assert tokens
    output = capsys.readouterr().out
    details = " ".join(
        str(r[0]) for r in db.execute(text("SELECT detail FROM security_events")).all()
    )
    for secret in [STRONG_PASSWORD, "wrong password value", *tokens, "token="]:
        assert secret not in output, secret
        assert secret not in details, secret
    assert "admin@example.com" not in output
