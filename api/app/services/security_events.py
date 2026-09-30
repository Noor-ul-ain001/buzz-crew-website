import uuid
from typing import Any

import structlog
from fastapi import Request
from sqlmodel import Session

from app.core import rate_limit
from app.models.user import SecurityEvent, SecurityEventType

log = structlog.get_logger()

_FORBIDDEN_KEYS = {"password", "token", "url", "link", "email"}


def record(
    session: Session,
    event_type: SecurityEventType,
    *,
    user_id: uuid.UUID | None = None,
    actor_id: uuid.UUID | None = None,
    request: Request | None = None,
    detail: dict[str, Any] | None = None,
    commit: bool = True,
) -> None:
    """Insert-only security record. Never pass passwords, tokens, links or emails in `detail`."""
    safe_detail = {k: v for k, v in (detail or {}).items() if k not in _FORBIDDEN_KEYS}
    session.add(
        SecurityEvent(
            type=event_type,
            user_id=user_id,
            actor_id=actor_id,
            ip_hash=rate_limit.client_ip_hash(request) if request else None,
            detail=safe_detail,
        )
    )
    if commit:
        session.commit()
    log.info(
        "security_event",
        type=event_type.value,
        user_id=str(user_id) if user_id else None,
        actor_id=str(actor_id) if actor_id else None,
    )
