"""leads (specs/001-project-inquiry-flow/data-model.md)

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0002"
down_revision: str | Sequence[str] | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

country = postgresql.ENUM("pakistan", "uae", "uk", "other", name="lead_country", create_type=False)
service = postgresql.ENUM(
    "social_media",
    "seo",
    "web_software",
    "ui_ux_design",
    "meta_ads",
    name="lead_service",
    create_type=False,
)
budget = postgresql.ENUM(
    "under_50k", "50k_150k", "150k_plus", "not_sure", name="lead_budget_range", create_type=False
)
status = postgresql.ENUM(
    "new", "contacted", "proposal_sent", "won", "lost", name="lead_status", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    for enum in (country, service, budget, status):
        enum.create(bind, checkfirst=True)

    op.create_table(
        "leads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("business", sa.String(150), nullable=True),
        sa.Column("country", country, nullable=False),
        sa.Column("services", postgresql.ARRAY(service), nullable=False),
        sa.Column("budget_range", budget, nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", status, nullable=False, server_default="new"),
        sa.Column("source", sa.String(40), nullable=False, server_default="contact_form"),
        sa.Column("source_page", sa.String(200), nullable=False),
        sa.Column("idempotency_key", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("post_process_token_hash", sa.CHAR(64), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ux_leads_idempotency_key", "leads", ["idempotency_key"], unique=True)
    op.create_index("ix_leads_created_at", "leads", ["created_at"])
    op.create_index("ix_leads_status", "leads", ["status"])


def downgrade() -> None:
    op.drop_table("leads")
    bind = op.get_bind()
    for enum in (status, budget, service, country):
        enum.drop(bind, checkfirst=True)
