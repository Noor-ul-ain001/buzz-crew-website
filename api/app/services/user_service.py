"""Team accounts: invitations, role changes, deactivation, last-admin guard (003 US4)."""

import hmac
import uuid
from datetime import timedelta

from fastapi import HTTPException, Request, status
from sqlalchemy import func, update
from sqlmodel import Session, col, select

from app.core import clock, rate_limit
from app.core.config import get_settings
from app.core.security import hash_token, new_token
from app.models.user import (
    AttemptKind,
    Invitation,
    SecurityEventType,
    SessionEndReason,
    User,
    UserRole,
    UserStatus,
)
from app.services import auth_service, email_service, security_events

INVITATION_TTL = timedelta(hours=72)

USER_EXISTS = {"code": "user_exists", "message": "This person already has an account."}
LAST_ADMIN = {
    "code": "last_admin",
    "message": "At least one active admin is needed, so this change isn't allowed.",
}
NOT_FOUND = {"code": "not_found", "message": "No such team member."}
SIGNUP_DISABLED = {
    "code": "signup_disabled",
    "message": "Sign-up is closed. Ask an admin for an invitation.",
}
INVALID_SIGNUP_CODE = {
    "code": "invalid_signup_code",
    "message": "That sign-up code isn't right. Ask an admin for the current code.",
}
SIGNUPS_PER_HOUR = 5


def _send_invitation(session: Session, user: User, invited_by: uuid.UUID | None) -> None:
    session.execute(  # pyright: ignore[reportDeprecated]
        update(Invitation)
        .where(
            col(Invitation.user_id) == user.id,
            col(Invitation.accepted_at).is_(None),
            col(Invitation.cancelled_at).is_(None),
        )
        .values(cancelled_at=clock.now())
    )
    token = new_token()
    session.add(
        Invitation(
            email=user.email,
            role=user.role,
            user_id=user.id,
            invited_by=invited_by,
            token_hash=hash_token(token),
            expires_at=clock.now() + INVITATION_TTL,
        )
    )
    session.commit()
    link = f"{get_settings().web_url}/admin/accept-invite?token={token}"
    email_service.send_message(
        user.email,
        "You're invited to The Buzz Crew admin",
        "invitation",
        {"name": user.name, "role": user.role.value.title(), "link": link},
    )


def invite(
    session: Session, *, email: str, name: str, role: UserRole, actor: User, request: Request
) -> User:
    auth_service.check_request_limit(session, AttemptKind.INVITE_REQUEST, email, request)
    if auth_service.find_user(session, email) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=USER_EXISTS)
    user = User(
        email=auth_service.normalise_email(email),
        name=name.strip(),
        role=role,
        status=UserStatus.INVITED,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    _send_invitation(session, user, actor.id)
    security_events.record(
        session,
        SecurityEventType.INVITATION_SENT,
        user_id=user.id,
        actor_id=actor.id,
        request=request,
        detail={"role": role.value},
    )
    return user


def _invited_user(session: Session, user_id: uuid.UUID) -> User:
    user = session.get(User, user_id)
    if user is None or user.status is not UserStatus.INVITED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)
    return user


def resend_invite(session: Session, user_id: uuid.UUID, actor: User, request: Request) -> None:
    user = _invited_user(session, user_id)
    auth_service.check_request_limit(session, AttemptKind.INVITE_REQUEST, user.email, request)
    _send_invitation(session, user, actor.id)
    security_events.record(
        session,
        SecurityEventType.INVITATION_SENT,
        user_id=user.id,
        actor_id=actor.id,
        request=request,
        detail={"resend": True},
    )


def cancel_invite(session: Session, user_id: uuid.UUID, actor: User, request: Request) -> None:
    user = _invited_user(session, user_id)
    session.execute(  # pyright: ignore[reportDeprecated]
        update(Invitation)
        .where(col(Invitation.user_id) == user.id, col(Invitation.accepted_at).is_(None))
        .values(cancelled_at=clock.now())
    )
    session.commit()
    security_events.record(
        session,
        SecurityEventType.INVITATION_CANCELLED,
        user_id=user.id,
        actor_id=actor.id,
        request=request,
    )


def accept_invite(
    session: Session, token: str, password: str, request: Request
) -> auth_service.SignedIn:
    invitation = session.exec(
        select(Invitation).where(Invitation.token_hash == hash_token(token))
    ).first()
    if (
        invitation is None
        or invitation.accepted_at is not None
        or invitation.cancelled_at is not None
        or invitation.expires_at <= clock.now()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=auth_service.INVALID_TOKEN
        )
    user = session.get(User, invitation.user_id)
    if user is None or user.status is not UserStatus.INVITED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=auth_service.INVALID_TOKEN
        )

    from app.services import password_policy

    problems = password_policy.check(password, user.email)
    if problems:
        raise auth_service.weak_password_error(problems)

    from app.core.security import hash_password

    user.password_hash = hash_password(password)
    user.status = UserStatus.ACTIVE
    user.updated_at = clock.now()
    invitation.accepted_at = clock.now()
    session.add(user)
    session.add(invitation)
    session.commit()
    security_events.record(
        session, SecurityEventType.INVITATION_ACCEPTED, user_id=user.id, request=request
    )
    return auth_service.start_session(session, user, request)


def signup(
    session: Session, *, name: str, email: str, password: str, code: str, request: Request
) -> auth_service.SignedIn:
    """Self-service staff account, gated by the shared sign-up code. Always an editor:
    only an existing admin can grant admin rights."""
    expected = get_settings().admin_signup_code
    if not expected:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=SIGNUP_DISABLED)
    # Throttle per visitor before checking the code, so it can't be guessed quickly.
    rate_limit.hit(
        session,
        kind="admin_signup",
        key_hash=rate_limit.client_ip_hash(request),
        limit=SIGNUPS_PER_HOUR,
        window=timedelta(hours=1),
    )
    if not hmac.compare_digest(code.encode("utf-8"), expected.encode("utf-8")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=INVALID_SIGNUP_CODE)
    if auth_service.find_user(session, email) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=USER_EXISTS)

    from app.services import password_policy

    normalised = auth_service.normalise_email(email)
    problems = password_policy.check(password, normalised)
    if problems:
        raise auth_service.weak_password_error(problems)

    from app.core.security import hash_password

    user = User(
        email=normalised,
        name=name.strip(),
        role=UserRole.EDITOR,
        status=UserStatus.ACTIVE,
        password_hash=hash_password(password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    security_events.record(session, SecurityEventType.SIGNED_UP, user_id=user.id, request=request)
    return auth_service.start_session(session, user, request)


def _lock_active_admins(session: Session) -> int:
    rows = session.exec(
        select(User.id)
        .where(User.role == UserRole.ADMIN, User.status == UserStatus.ACTIVE)
        .with_for_update()
    ).all()
    return len(rows)


def update_user(
    session: Session,
    user_id: uuid.UUID,
    *,
    role: UserRole | None,
    new_status: UserStatus | None,
    actor: User,
    request: Request,
) -> User:
    # Lock the active-admin rows first so concurrent demotions can't both succeed (R9).
    active_admins = _lock_active_admins(session)
    user = session.exec(select(User).where(User.id == user_id).with_for_update()).first()
    if user is None:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)

    losing_admin = (
        user.role is UserRole.ADMIN
        and user.status is UserStatus.ACTIVE
        and (
            (role is not None and role is not UserRole.ADMIN)
            or (new_status is not None and new_status is not UserStatus.ACTIVE)
        )
    )
    if losing_admin and active_admins <= 1:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=LAST_ADMIN)

    events: list[tuple[SecurityEventType, dict[str, str]]] = []
    if role is not None and role is not user.role:
        events.append(
            (SecurityEventType.ROLE_CHANGED, {"from_role": user.role.value, "to_role": role.value})
        )
        user.role = role
    ended = False
    if new_status is not None and new_status is not user.status:
        if new_status is UserStatus.DEACTIVATED:
            events.append((SecurityEventType.USER_DEACTIVATED, {}))
            ended = True
        elif new_status is UserStatus.ACTIVE and user.status is UserStatus.DEACTIVATED:
            events.append((SecurityEventType.USER_REACTIVATED, {}))
        user.status = new_status
    user.updated_at = clock.now()
    session.add(user)
    session.commit()
    session.refresh(user)

    if ended:
        auth_service.end_sessions(session, user.id, SessionEndReason.DEACTIVATED)
    for event_type, detail in events:
        security_events.record(
            session, event_type, user_id=user.id, actor_id=actor.id, request=request, detail=detail
        )
    return user


def list_users(session: Session) -> list[tuple[User, Invitation | None]]:
    users = session.exec(select(User).order_by(func.lower(User.name))).all()
    pending = {
        inv.user_id: inv
        for inv in session.exec(
            select(Invitation).where(
                col(Invitation.accepted_at).is_(None), col(Invitation.cancelled_at).is_(None)
            )
        ).all()
    }
    return [(user, pending.get(user.id)) for user in users]
