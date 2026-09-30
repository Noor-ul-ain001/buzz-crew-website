"""staff sign-up event type; media and retail case study industries

Revision ID: 0007
Revises: 0006
Create Date: 2026-09-30
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0007"
down_revision: str | Sequence[str] | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TYPE security_event_type ADD VALUE IF NOT EXISTS 'signed_up'")
    op.execute("ALTER TYPE case_study_industry ADD VALUE IF NOT EXISTS 'media_news'")
    op.execute("ALTER TYPE case_study_industry ADD VALUE IF NOT EXISTS 'retail'")


def downgrade() -> None:
    # Postgres can't drop single enum values; unused labels are harmless.
    pass
