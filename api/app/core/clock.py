from datetime import UTC, datetime


def now() -> datetime:
    """Current UTC time. Always call as `clock.now()` so tests can move the clock."""
    return datetime.now(UTC)
