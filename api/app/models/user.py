import uuid
from datetime import datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import CHAR, BigInteger, Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlmodel import Field, SQLModel

from app.core import clock
from app.models.lead import pg_enum


def _now() -> datetime:
    return clock.now()


class UserRole(StrEnum):
    ADMIN = "admin"
    EDITOR = "editor"


class UserStatus(StrEnum):
    INVITED = "invited"
    ACTIVE = "active"
    DEACTIVATED = "deactivated"


class SessionEndReason(StrEnum):
    SIGNED_OUT = "signed_out"
    IDLE = "idle"
    MAX_AGE = "max_age"
    DEACTIVATED = "deactivated"
    PASSWORD_CHANGED = "password_changed"  # noqa: S105
    ROLE_CHANGED_FORCED = "role_changed_forced"


class SecurityEventType(StrEnum):
    LOGIN_SUCCEEDED = "login_succeeded"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    LOCKOUT = "lockout"
    PASSWORD_RESET_REQUESTED = "password_reset_requested"  # noqa: S105
    PASSWORD_RESET_COMPLETED = "password_reset_completed"  # noqa: S105
    PASSWORD_CHANGED = "password_changed"  # noqa: S105
    INVITATION_SENT = "invitation_sent"
    INVITATION_ACCEPTED = "invitation_accepted"
    INVITATION_CANCELLED = "invitation_cancelled"
    SIGNED_UP = "signed_up"
    ROLE_CHANGED = "role_changed"
    USER_DEACTIVATED = "user_deactivated"
    USER_REACTIVATED = "user_reactivated"
    ACCESS_DENIED = "access_denied"


class AttemptKind(StrEnum):
    LOGIN_FAILED = "login_failed"
    RESET_REQUEST = "reset_request"
    INVITE_REQUEST = "invite_request"


def _id_column() -> Any:
    return Column(UUID(as_uuid=True), primary_key=True)


def _ts(nullable: bool = False) -> Any:
    return Column(DateTime(timezone=True), nullable=nullable)


class User(SQLModel, table=True):
    __tablename__ = "users"  # pyright: ignore[reportAssignmentType]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, sa_column=_id_column())
    email: str = Field(sa_column=Column(String(254), nullable=False))
    name: str = Field(sa_column=Column(String(100), nullable=False))
    password_hash: str | None = Field(default=None, sa_column=Column(String(255), nullable=True))
    role: UserRole = Field(sa_column=Column(pg_enum(UserRole, "user_role"), nullable=False))
    status: UserStatus = Field(
        default=UserStatus.INVITED,
        sa_column=Column(pg_enum(UserStatus, "user_status"), nullable=False),
    )
    last_login_at: datetime | None = Field(default=None, sa_column=_ts(nullable=True))
    created_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
    )


class AuthSession(SQLModel, table=True):
    """One signed-in device. Only the token's SHA-256 is stored (research R1)."""

    __tablename__ = "sessions"  # pyright: ignore[reportAssignmentType]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, sa_column=_id_column())
    user_id: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        )
    )
    token_hash: str = Field(sa_column=Column(CHAR(64), nullable=False, unique=True))
    created_at: datetime = Field(default_factory=_now, sa_column=_ts())
    last_seen_at: datetime = Field(default_factory=_now, sa_column=_ts())
    ended_at: datetime | None = Field(default=None, sa_column=_ts(nullable=True))
    end_reason: SessionEndReason | None = Field(
        default=None,
        sa_column=Column(pg_enum(SessionEndReason, "session_end_reason"), nullable=True),
    )
    ip_hash: str | None = Field(default=None, sa_column=Column(CHAR(64), nullable=True))
    user_agent_family: str | None = Field(default=None, sa_column=Column(String(40)))


class Invitation(SQLModel, table=True):
    __tablename__ = "invitations"  # pyright: ignore[reportAssignmentType]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, sa_column=_id_column())
    email: str = Field(sa_column=Column(String(254), nullable=False))
    role: UserRole = Field(sa_column=Column(pg_enum(UserRole, "user_role"), nullable=False))
    user_id: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        )
    )
    invited_by: uuid.UUID | None = Field(
        default=None,
        sa_column=Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True),
    )
    token_hash: str = Field(sa_column=Column(CHAR(64), nullable=False, unique=True))
    expires_at: datetime = Field(sa_column=_ts())
    accepted_at: datetime | None = Field(default=None, sa_column=_ts(nullable=True))
    cancelled_at: datetime | None = Field(default=None, sa_column=_ts(nullable=True))
    created_at: datetime = Field(default_factory=_now, sa_column=_ts())


class PasswordReset(SQLModel, table=True):
    __tablename__ = "password_resets"  # pyright: ignore[reportAssignmentType]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, sa_column=_id_column())
    user_id: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        )
    )
    token_hash: str = Field(sa_column=Column(CHAR(64), nullable=False, unique=True))
    expires_at: datetime = Field(sa_column=_ts())
    used_at: datetime | None = Field(default=None, sa_column=_ts(nullable=True))
    created_at: datetime = Field(default_factory=_now, sa_column=_ts())


class LoginAttempt(SQLModel, table=True):
    __tablename__ = "login_attempts"  # pyright: ignore[reportAssignmentType]

    id: int | None = Field(default=None, sa_column=Column(BigInteger, primary_key=True))
    email_hash: str = Field(sa_column=Column(CHAR(64), nullable=False, index=True))
    ip_hash: str = Field(sa_column=Column(CHAR(64), nullable=False, index=True))
    kind: AttemptKind = Field(
        sa_column=Column(pg_enum(AttemptKind, "attempt_kind"), nullable=False)
    )
    attempted_at: datetime = Field(default_factory=_now, sa_column=_ts())


class SecurityEvent(SQLModel, table=True):
    """Append-only record (FR-027/028). Never holds passwords, tokens or links."""

    __tablename__ = "security_events"  # pyright: ignore[reportAssignmentType]

    id: int | None = Field(default=None, sa_column=Column(BigInteger, primary_key=True))
    type: SecurityEventType = Field(
        sa_column=Column(pg_enum(SecurityEventType, "security_event_type"), nullable=False)
    )
    user_id: uuid.UUID | None = Field(default=None, sa_column=Column(UUID(as_uuid=True)))
    actor_id: uuid.UUID | None = Field(default=None, sa_column=Column(UUID(as_uuid=True)))
    ip_hash: str | None = Field(default=None, sa_column=Column(CHAR(64), nullable=True))
    detail: dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}")
    )
    created_at: datetime = Field(default_factory=_now, sa_column=_ts())
