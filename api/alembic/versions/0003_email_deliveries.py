"""email_deliveries (specs/001-project-inquiry-flow/data-model.md)

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

kind = postgresql.ENUM(
    "team_notification", "client_confirmation", name="email_kind", create_type=False
)
status = postgresql.ENUM("sent", "failed", name="email_status", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    kind.create(bind, checkfirst=True)
    status.create(bind, checkfirst=True)
    op.create_table(
        "email_deliveries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "lead_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("leads.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", kind, nullable=False),
        sa.Column("status", status, nullable=False),
        sa.Column("provider_message_id", sa.String(100), nullable=True),
        sa.Column("error_code", sa.String(60), nullable=True),
        sa.Column("attempted_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_email_deliveries_lead_id", "email_deliveries", ["lead_id"])


def downgrade() -> None:
    op.drop_table("email_deliveries")
    bind = op.get_bind()
    status.drop(bind, checkfirst=True)
    kind.drop(bind, checkfirst=True)
