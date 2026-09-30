from typing import Any

from tests.conftest import Clock, FakeResend, login


def fail(client: Any, email: str = "admin@example.com", ip: str = "203.0.113.9") -> Any:
    return client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "definitely wrong"},
        headers={"X-Forwarded-For": ip},
    )


def test_account_blocked_after_five_failures(
    client: Any, admin: Any, clock: Clock, fake_resend: FakeResend
) -> None:
    for _ in range(5):
        assert fail(client).status_code == 401
    blocked = login(client)  # correct password, still refused
    assert blocked.status_code == 429
    assert blocked.json()["detail"]["code"] == "too_many_attempts"
    assert int(blocked.headers["Retry-After"]) > 0
    notices = [m for m in fake_resend.sent if "blocked" in m["subject"].lower()]
    assert len(notices) == 1

    fail(client)  # still one notice per window
    assert len([m for m in fake_resend.sent if "blocked" in m["subject"].lower()]) == 1

    clock.advance(minutes=15, seconds=1)
    assert login(client).status_code == 200


def test_ip_blocked_after_twenty_failures(client: Any, admin: Any, clock: Clock) -> None:
    for i in range(20):
        fail(client, email=f"user{i}@example.com")
    response = fail(client, email="someone-else@example.com")
    assert response.status_code == 429
    other_ip = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "correct horse battery staple"},
        headers={"X-Forwarded-For": "198.51.100.1"},
    )
    assert other_ip.status_code == 200


def test_unknown_email_still_counts(client: Any, clock: Clock) -> None:
    for _ in range(5):
        fail(client, email="ghost@example.com")
    assert fail(client, email="ghost@example.com").status_code == 429
