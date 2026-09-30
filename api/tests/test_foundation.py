from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from fastapi import HTTPException

from app.core import rate_limit


def test_health(client: Any) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["x-request-id"]


def test_ready_checks_database(client: Any) -> None:
    assert client.get("/api/health/ready").json() == {"status": "ok"}


def test_request_id_is_echoed(client: Any) -> None:
    response = client.get("/api/health", headers={"X-Request-ID": "abc123"})
    assert response.headers["x-request-id"] == "abc123"


def test_rate_limit_counts_per_window(db: Any) -> None:
    now = datetime(2026, 9, 28, 10, 15, tzinfo=UTC)
    for expected in range(1, 4):
        count = rate_limit.hit(
            db, kind="t", key_hash="k" * 64, limit=3, window=timedelta(hours=1), now=now
        )
        assert count == expected

    with pytest.raises(HTTPException) as exc:
        rate_limit.hit(db, kind="t", key_hash="k" * 64, limit=3, window=timedelta(hours=1), now=now)
    assert exc.value.status_code == 429
    assert exc.value.detail["code"] == "rate_limited"  # pyright: ignore[reportIndexIssue]
    assert exc.value.headers is not None
    assert int(exc.value.headers["Retry-After"]) == 45 * 60

    # A new window starts a fresh count, and other keys are unaffected.
    later = now + timedelta(hours=1)
    assert (
        rate_limit.hit(
            db, kind="t", key_hash="k" * 64, limit=3, window=timedelta(hours=1), now=later
        )
        == 1
    )
    assert (
        rate_limit.hit(db, kind="t", key_hash="x" * 64, limit=3, window=timedelta(hours=1), now=now)
        == 1
    )
