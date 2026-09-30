"""Session and role checks applied on the server to every protected route (FR-002).

Sessions are opaque random tokens stored hashed (research R1): each request re-checks the
session, so sign-out, deactivation, role and password changes apply on the very next action.
"""

from collections.abc import Callable, Coroutine
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, select

from app.core import clock
from app.core.config import get_settings
from app.core.csrf import verify_origin
from app.core.database import get_session
from app.core.security import hash_token
from app.models.user import (
    AuthSession,
    SecurityEventType,
    SessionEndReason,
    User,
    UserRole,
    UserStatus,
)
from app.services import security_events

LAST_SEEN_WRITE_INTERVAL = timedelta(minutes=1)

NOT_AUTHENTICATED = {"code": "not_authenticated", "message": "Please sign in to continue."}
FORBIDDEN = {"code": "forbidden", "message": "You don't have access to this."}


@dataclass
class CurrentUser:
    user: User
    session: AuthSession

    @property
    def idle_expires_at(self) -> datetime:
        return self.session.last_seen_at + timedelta(minutes=get_settings().session_idle_minutes)

    @property
    def session_expires_at(self) -> datetime:
        return self.session.created_at + timedelta(hours=get_settings().session_max_hours)


def end_reason_for(auth_session: AuthSession, current: datetime) -> SessionEndReason | None:
    settings = get_settings()
    if current >= auth_session.created_at + timedelta(hours=settings.session_max_hours):
        return SessionEndReason.MAX_AGE
    if current >= auth_session.last_seen_at + timedelta(minutes=settings.session_idle_minutes):
        return SessionEndReason.IDLE
    return None


def _unauthorised() -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=NOT_AUTHENTICATED)


def get_current_user(
    request: Request,
    session: Annotated[Session, Depends(get_session)],
) -> CurrentUser:
    token = request.cookies.get(get_settings().session_cookie_name)
    if not token:
        raise _unauthorised()

    row = session.exec(
        select(AuthSession, User)
        .join(User, User.id == AuthSession.user_id)  # pyright: ignore[reportArgumentType]
        .where(AuthSession.token_hash == hash_token(token))
    ).first()
    if row is None:
        raise _unauthorised()
    auth_session, user = row
    if auth_session.ended_at is not None:
        raise _unauthorised()
    if user.status is not UserStatus.ACTIVE:
        auth_session.ended_at = clock.now()
        auth_session.end_reason = SessionEndReason.DEACTIVATED
        session.add(auth_session)
        session.commit()
        raise _unauthorised()

    current = clock.now()
    reason = end_reason_for(auth_session, current)
    if reason is not None:
        auth_session.ended_at = current
        auth_session.end_reason = reason
        session.add(auth_session)
        session.commit()
        raise _unauthorised()

    if current - auth_session.last_seen_at >= LAST_SEEN_WRITE_INTERVAL:
        auth_session.last_seen_at = current
        session.add(auth_session)
        session.commit()
        session.refresh(auth_session)

    verify_origin(request)
    return CurrentUser(user=user, session=auth_session)


RoleDependency = Callable[..., Coroutine[Any, Any, CurrentUser]]


def require_role(*roles: UserRole) -> RoleDependency:
    """Dependency factory: signed in, and (if roles are given) holding one of them."""

    async def dependency(
        request: Request,
        session: Annotated[Session, Depends(get_session)],
        current: Annotated[CurrentUser, Depends(get_current_user)],
    ) -> CurrentUser:
        if roles and current.user.role not in roles:
            security_events.record(
                session,
                SecurityEventType.ACCESS_DENIED,
                user_id=current.user.id,
                request=request,
                detail={"path": request.url.path, "method": request.method},
            )
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
        return current

    dependency.required_roles = tuple(roles)  # type: ignore[attr-defined]  # read by the role-matrix test
    return dependency


require_signed_in = require_role()
require_admin = require_role(UserRole.ADMIN)
require_staff = require_role(UserRole.ADMIN, UserRole.EDITOR)

SignedIn = Annotated[CurrentUser, Depends(require_signed_in)]
Admin = Annotated[CurrentUser, Depends(require_admin)]
Staff = Annotated[CurrentUser, Depends(require_staff)]


def admin_only_router(**kwargs: Any) -> APIRouter:
    """Router whose every route requires an admin session (leads, applicants, users, settings)."""
    return APIRouter(dependencies=[Depends(require_admin)], **kwargs)


def staff_router(**kwargs: Any) -> APIRouter:
    """Router for content management: admins and editors."""
    return APIRouter(dependencies=[Depends(require_staff)], **kwargs)
