"""Sign-in, sessions, lockout, password reset and change (003 US1, US3, US5, US6)."""

import hashlib
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import cast

from fastapi import HTTPException, Request, status
from sqlalchemy import func, update
from sqlmodel import Session, col, select

from app.core import clock, rate_limit
from app.core.config import get_settings
from app.core.security import hash_password, hash_token, new_token, verify_password
from app.models.user import (
    AttemptKind,
    AuthSession,
    LoginAttempt,
    PasswordReset,
    SecurityEventType,
    SessionEndReason,
    User,
    UserStatus,
)
from app.services import email_service, password_policy, security_events

LOCKOUT_WINDOW = timedelta(minutes=15)
ACCOUNT_FAILURE_LIMIT = 5
IP_FAILURE_LIMIT = 20
REQUESTS_PER_HOUR = 5
RESET_TTL = timedelta(hours=1)

INVALID_CREDENTIALS = {
    "code": "invalid_credentials",
    "message": "The email or password is incorrect.",
}
TOO_MANY_ATTEMPTS = {
    "code": "too_many_attempts",
    "message": "Too many failed attempts. Try again in 15 minutes or reset your password.",
}
INVALID_TOKEN = {
    "code": "invalid_or_expired_token",
    "message": "This link has expired or has already been used. Please request a new one.",
}
RESET_ACCEPTED_MESSAGE = "If an account exists for this email, we've sent a reset link."


def normalise_email(email: str) -> str:
    return email.strip().lower()


def email_hash(email: str) -> str:
    return hashlib.sha256(normalise_email(email).encode("utf-8")).hexdigest()


def find_user(session: Session, email: str) -> User | None:
    return session.exec(
        select(User).where(func.lower(User.email) == normalise_email(email))
    ).first()


def weak_password_error(problems: list[str]) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"code": "weak_password", "message": " ".join(problems)},
    )


# --- attempt counting (Postgres, DEPLOYMENT D3) ---------------------------------------------


def _count(session: Session, kind: AttemptKind, *, since: datetime, **match: str) -> int:
    query = (
        select(func.count())
        .select_from(LoginAttempt)
        .where(LoginAttempt.kind == kind, LoginAttempt.attempted_at > since)
    )
    for column, value in match.items():
        query = query.where(getattr(LoginAttempt, column) == value)
    return int(session.exec(query).one())


def _record_attempt(session: Session, kind: AttemptKind, e_hash: str, ip_hash: str) -> None:
    session.add(LoginAttempt(kind=kind, email_hash=e_hash, ip_hash=ip_hash))
    session.commit()


def _retry_after(session: Session, e_hash: str, ip_hash: str) -> int:
    oldest = cast(
        datetime | None,
        session.exec(
            select(func.min(LoginAttempt.attempted_at)).where(
                LoginAttempt.kind == AttemptKind.LOGIN_FAILED,
                LoginAttempt.attempted_at > clock.now() - LOCKOUT_WINDOW,
                (LoginAttempt.email_hash == e_hash) | (LoginAttempt.ip_hash == ip_hash),
            )
        ).one(),
    )
    if oldest is None:
        return 60
    return max(1, int((oldest + LOCKOUT_WINDOW - clock.now()).total_seconds()))


def check_request_limit(session: Session, kind: AttemptKind, email: str, request: Request) -> None:
    """Reset and invitation requests: 5 per email per hour (FR-014)."""
    e_hash = email_hash(email)
    since = clock.now() - timedelta(hours=1)
    if _count(session, kind, since=since, email_hash=e_hash) >= REQUESTS_PER_HOUR:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "rate_limited", "message": rate_limit.RATE_LIMITED_MESSAGE},
            headers={"Retry-After": "3600"},
        )
    _record_attempt(session, kind, e_hash, rate_limit.client_ip_hash(request))


# --- sessions --------------------------------------------------------------------------------


@dataclass
class SignedIn:
    user: User
    session: AuthSession
    token: str


def start_session(session: Session, user: User, request: Request) -> SignedIn:
    token = new_token()
    now = clock.now()
    auth_session = AuthSession(
        user_id=user.id,
        token_hash=hash_token(token),
        created_at=now,
        last_seen_at=now,
        ip_hash=rate_limit.client_ip_hash(request),
        user_agent_family=_ua_family(request.headers.get("user-agent", "")),
    )
    user.last_login_at = now
    session.add(auth_session)
    session.add(user)
    session.commit()
    session.refresh(auth_session)
    session.refresh(user)
    return SignedIn(user=user, session=auth_session, token=token)


def _ua_family(user_agent: str) -> str:
    for family in ("Edg", "Chrome", "Firefox", "Safari"):
        if family in user_agent:
            return {"Edg": "Edge"}.get(family, family)
    return "Other"


def end_sessions(
    session: Session,
    user_id: object,
    reason: SessionEndReason,
    *,
    except_session_id: object | None = None,
) -> None:
    stmt = (
        update(AuthSession)
        .where(col(AuthSession.user_id) == user_id, col(AuthSession.ended_at).is_(None))
        .values(ended_at=clock.now(), end_reason=reason)
    )
    if except_session_id is not None:
        stmt = stmt.where(col(AuthSession.id) != except_session_id)
    session.execute(stmt)  # pyright: ignore[reportDeprecated]
    session.commit()


def sign_in(session: Session, email: str, password: str, request: Request) -> SignedIn:
    e_hash = email_hash(email)
    ip_hash = rate_limit.client_ip_hash(request)
    since = clock.now() - LOCKOUT_WINDOW

    account_failures = _count(session, AttemptKind.LOGIN_FAILED, since=since, email_hash=e_hash)
    ip_failures = _count(session, AttemptKind.LOGIN_FAILED, since=since, ip_hash=ip_hash)
    user = find_user(session, email)

    if account_failures >= ACCOUNT_FAILURE_LIMIT or ip_failures >= IP_FAILURE_LIMIT:
        _record_attempt(session, AttemptKind.LOGIN_FAILED, e_hash, ip_hash)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=TOO_MANY_ATTEMPTS,
            headers={"Retry-After": str(_retry_after(session, e_hash, ip_hash))},
        )

    valid, new_hash = verify_password(password, user.password_hash if user else None)
    if not valid or user is None or user.status is not UserStatus.ACTIVE:
        _record_attempt(session, AttemptKind.LOGIN_FAILED, e_hash, ip_hash)
        security_events.record(
            session,
            SecurityEventType.LOGIN_FAILED,
            user_id=user.id if user else None,
            request=request,
        )
        if user is not None and account_failures + 1 == ACCOUNT_FAILURE_LIMIT:
            # The attempt that triggers the block: tell the account holder once per window.
            security_events.record(
                session, SecurityEventType.LOCKOUT, user_id=user.id, request=request
            )
            email_service.send_message(
                user.email, "Sign-in temporarily blocked", "lockout_notice", {"name": user.name}
            )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=INVALID_CREDENTIALS)

    if new_hash is not None:
        user.password_hash = new_hash
    signed_in = start_session(session, user, request)
    security_events.record(
        session, SecurityEventType.LOGIN_SUCCEEDED, user_id=user.id, request=request
    )
    return signed_in


def sign_out(session: Session, auth_session: AuthSession, request: Request) -> None:
    auth_session.ended_at = clock.now()
    auth_session.end_reason = SessionEndReason.SIGNED_OUT
    session.add(auth_session)
    session.commit()
    security_events.record(
        session, SecurityEventType.LOGOUT, user_id=auth_session.user_id, request=request
    )


def extend(session: Session, auth_session: AuthSession) -> AuthSession:
    auth_session.last_seen_at = clock.now()
    session.add(auth_session)
    session.commit()
    session.refresh(auth_session)
    return auth_session


# --- passwords -------------------------------------------------------------------------------


def set_password(
    session: Session,
    user: User,
    password: str,
    *,
    keep_session_id: object | None = None,
) -> None:
    problems = password_policy.check(password, user.email)
    if problems:
        raise weak_password_error(problems)
    user.password_hash = hash_password(password)
    user.updated_at = clock.now()
    session.add(user)
    session.execute(  # pyright: ignore[reportDeprecated]
        update(PasswordReset)
        .where(col(PasswordReset.user_id) == user.id, col(PasswordReset.used_at).is_(None))
        .values(used_at=clock.now())
    )
    session.commit()
    end_sessions(
        session, user.id, SessionEndReason.PASSWORD_CHANGED, except_session_id=keep_session_id
    )
    email_service.send_message(
        user.email, "Your password was changed", "password_changed", {"name": user.name}
    )


def request_reset(session: Session, email: str, request: Request) -> None:
    check_request_limit(session, AttemptKind.RESET_REQUEST, email, request)
    user = find_user(session, email)
    if user is None or user.status is not UserStatus.ACTIVE:
        return  # Identical response either way (FR-025).
    session.execute(  # pyright: ignore[reportDeprecated]
        update(PasswordReset)
        .where(col(PasswordReset.user_id) == user.id, col(PasswordReset.used_at).is_(None))
        .values(used_at=clock.now())
    )
    token = new_token()
    session.add(
        PasswordReset(
            user_id=user.id, token_hash=hash_token(token), expires_at=clock.now() + RESET_TTL
        )
    )
    session.commit()
    security_events.record(
        session, SecurityEventType.PASSWORD_RESET_REQUESTED, user_id=user.id, request=request
    )
    link = f"{get_settings().web_url}/admin/reset-password?token={token}"
    email_service.send_message(
        user.email, "Reset your password", "password_reset", {"name": user.name, "link": link}
    )


def confirm_reset(session: Session, token: str, password: str, request: Request) -> None:
    reset = session.exec(
        select(PasswordReset).where(PasswordReset.token_hash == hash_token(token))
    ).first()
    if reset is None or reset.used_at is not None or reset.expires_at <= clock.now():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INVALID_TOKEN)
    user = session.get(User, reset.user_id)
    if user is None or user.status is not UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INVALID_TOKEN)
    set_password(session, user, password)
    security_events.record(
        session, SecurityEventType.PASSWORD_RESET_COMPLETED, user_id=user.id, request=request
    )


def change_password(
    session: Session,
    user: User,
    auth_session: AuthSession,
    current_password: str,
    new_password: str,
    request: Request,
) -> None:
    valid, _ = verify_password(current_password, user.password_hash)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INVALID_CREDENTIALS)
    set_password(session, user, new_password, keep_session_id=auth_session.id)
    security_events.record(
        session, SecurityEventType.PASSWORD_CHANGED, user_id=user.id, request=request
    )


def prune_login_attempts(session: Session) -> int:
    """Daily job (DEPLOYMENT D5): drop attempt rows older than 24 hours."""
    from sqlalchemy import delete

    result = session.execute(  # pyright: ignore[reportDeprecated]
        delete(LoginAttempt).where(
            col(LoginAttempt.attempted_at) < clock.now() - timedelta(hours=24)
        )
    )
    session.commit()
    removed = cast(int, getattr(result, "rowcount", 0) or 0)
    return removed
