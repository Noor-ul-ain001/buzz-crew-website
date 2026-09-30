"""auth: users, sessions, invitations, password_resets, login_attempts, security_events (003)

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0004"
down_revision: str | Sequence[str] | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

role = postgresql.ENUM("admin", "editor", name="user_role", create_type=False)
user_status = postgresql.ENUM(
    "invited", "active", "deactivated", name="user_status", create_type=False
)
end_reason = postgresql.ENUM(
    "signed_out",
    "idle",
    "max_age",
    "deactivated",
    "password_changed",
    "role_changed_forced",
    name="session_end_reason",
    create_type=False,
)
event_type = postgresql.ENUM(
    "login_succeeded",
    "login_failed",
    "logout",
    "lockout",
    "password_reset_requested",
    "password_reset_completed",
    "password_changed",
    "invitation_sent",
    "invitation_accepted",
    "invitation_cancelled",
    "role_changed",
    "user_deactivated",
    "user_reactivated",
    "access_denied",
    name="security_event_type",
    create_type=False,
)
attempt_kind = postgresql.ENUM(
    "login_failed", "reset_request", "invite_request", name="attempt_kind", create_type=False
)

UUID = postgresql.UUID(as_uuid=True)


def upgrade() -> None:
    bind = op.get_bind()
    for enum in (role, user_status, end_reason, event_type, attempt_kind):
        enum.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("role", role, nullable=False),
        sa.Column("status", user_status, nullable=False, server_default="invited"),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("ux_users_email_lower", "users", [sa.text("lower(email)")], unique=True)

    op.create_table(
        "sessions",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.CHAR(64), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_reason", end_reason, nullable=True),
        sa.Column("ip_hash", sa.CHAR(64), nullable=True),
        sa.Column("user_agent_family", sa.String(40), nullable=True),
    )
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"])

    op.create_table(
        "invitations",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("role", role, nullable=False),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("invited_by", UUID, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("token_hash", sa.CHAR(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "password_resets",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.CHAR(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "login_attempts",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("email_hash", sa.CHAR(64), nullable=False),
        sa.Column("ip_hash", sa.CHAR(64), nullable=False),
        sa.Column("kind", attempt_kind, nullable=False),
        sa.Column("attempted_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_login_attempts_email", "login_attempts", ["email_hash", "attempted_at"])
    op.create_index("ix_login_attempts_ip", "login_attempts", ["ip_hash", "attempted_at"])

    op.create_table(
        "security_events",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("type", event_type, nullable=False),
        sa.Column("user_id", UUID, nullable=True),
        sa.Column("actor_id", UUID, nullable=True),
        sa.Column("ip_hash", sa.CHAR(64), nullable=True),
        sa.Column("detail", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_security_events_created_at", "security_events", ["created_at"])
    # Append-only in production: grant the app role INSERT and SELECT only (see api/README.md).


def downgrade() -> None:
    for table in (
        "security_events",
        "login_attempts",
        "password_resets",
        "invitations",
        "sessions",
        "users",
    ):
        op.drop_table(table)
    bind = op.get_bind()
    for enum in (attempt_kind, event_type, end_reason, user_status, role):
        enum.drop(bind, checkfirst=True)
