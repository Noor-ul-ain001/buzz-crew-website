import hashlib
import math
from datetime import UTC, datetime, timedelta
from typing import cast

from fastapi import HTTPException, Request, status
from sqlalchemy import Table
from sqlalchemy.dialects.postgresql import insert
from sqlmodel import Session

from app.core.config import get_settings
from app.models.rate_limit import RateLimitHit

RATE_LIMITED_MESSAGE = "Too many attempts, please try again later."


def hash_key(value: str) -> str:
    return hashlib.sha256((value + get_settings().ip_hash_salt).encode("utf-8")).hexdigest()


def client_ip(request: Request) -> str:
    """First entry of X-Forwarded-For (set by Vercel), falling back to the socket peer."""
    forwarded = request.headers.get("x-forwarded-for", "")
    first = forwarded.split(",")[0].strip()
    if first:
        return first
    return request.client.host if request.client else "unknown"


def client_ip_hash(request: Request) -> str:
    return hash_key(client_ip(request))


def _window_start(now: datetime, window: timedelta) -> datetime:
    seconds = window.total_seconds()
    start = math.floor(now.timestamp() / seconds) * seconds
    return datetime.fromtimestamp(start, tz=UTC)


def hit(
    session: Session,
    *,
    kind: str,
    key_hash: str,
    limit: int,
    window: timedelta,
    now: datetime | None = None,
) -> int:
    """Count one hit atomically and raise 429 once the limit for this window is exceeded."""
    current = now or datetime.now(UTC)
    start = _window_start(current, window)
    table = cast(Table, RateLimitHit.__table__)  # pyright: ignore[reportAttributeAccessIssue]
    stmt = (
        insert(table)
        .values(key_hash=key_hash, kind=kind, window_start=start, count=1)
        .on_conflict_do_update(
            index_elements=["key_hash", "kind", "window_start"],
            set_={"count": table.c.count + 1},
        )
        .returning(table.c.count)
    )
    count = int(session.connection().execute(stmt).scalar_one())
    session.commit()
    if count > limit:
        retry_after = max(1, int((start + window - current).total_seconds()))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "rate_limited", "message": RATE_LIMITED_MESSAGE},
            headers={"Retry-After": str(retry_after)},
        )
    return count
