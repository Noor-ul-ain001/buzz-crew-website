"""case studies: stories, results, media, slug history (005)

Revision ID: 0006
Revises: 0005
Create Date: 2026-09-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0006"
down_revision: str | Sequence[str] | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

industry = postgresql.ENUM(
    "food_beverages",
    "farmhouses",
    "healthcare_dental",
    "education",
    "ecommerce",
    "other",
    name="case_study_industry",
    create_type=False,
)
media_kind = postgresql.ENUM("image", "reel", name="case_study_media_kind", create_type=False)
publish_status = postgresql.ENUM(name="publish_status", create_type=False)
lead_country = postgresql.ENUM(name="lead_country", create_type=False)
lead_service = postgresql.ENUM(name="lead_service", create_type=False)

UUID = postgresql.UUID(as_uuid=True)
TS = sa.DateTime(timezone=True)


def upgrade() -> None:
    bind = op.get_bind()
    industry.create(bind, checkfirst=True)
    media_kind.create(bind, checkfirst=True)

    op.create_table(
        "case_studies",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("status", publish_status, nullable=False, server_default="draft"),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("published_at", TS, nullable=True),
        sa.Column("last_published_at", TS, nullable=True),
        sa.Column("created_by", UUID, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("updated_by", UUID, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", TS, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", TS, nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", TS, nullable=True),
        sa.Column("slug", sa.String(80), nullable=False, unique=True),
        sa.Column("client_name", sa.String(100), nullable=False, server_default=""),
        sa.Column("title", sa.String(120), nullable=False, server_default=""),
        sa.Column("summary", sa.String(200), nullable=False, server_default=""),
        sa.Column("industry", industry, nullable=True),
        sa.Column("country", lead_country, nullable=True),
        sa.Column("services", postgresql.ARRAY(lead_service), nullable=False, server_default="{}"),
        sa.Column("challenge_md", sa.Text, nullable=False, server_default=""),
        sa.Column("strategy_md", sa.Text, nullable=False, server_default=""),
        sa.Column("execution_md", sa.Text, nullable=False, server_default=""),
        sa.Column("project_period", sa.String(40), nullable=True),
        sa.Column("cover_id", UUID, sa.ForeignKey("media.id"), nullable=True),
        sa.Column("before_image_id", UUID, sa.ForeignKey("media.id"), nullable=True),
        sa.Column("after_image_id", UUID, sa.ForeignKey("media.id"), nullable=True),
        sa.Column("before_label", sa.String(30), nullable=False, server_default="Before"),
        sa.Column("after_label", sa.String(30), nullable=False, server_default="After"),
        sa.Column("testimonial_id", UUID, sa.ForeignKey("testimonials.id"), nullable=True),
        sa.Column("seo_title", sa.String(60), nullable=True),
        sa.Column("seo_description", sa.String(160), nullable=True),
    )
    op.create_index(
        "ix_case_studies_public", "case_studies", ["status", "deleted_at", "sort_order"]
    )
    op.create_index("ix_case_studies_industry", "case_studies", ["industry"])
    op.create_index(
        "ix_case_studies_services", "case_studies", ["services"], postgresql_using="gin"
    )

    op.create_table(
        "case_study_results",
        sa.Column("id", UUID, primary_key=True),
        sa.Column(
            "case_study_id",
            UUID,
            sa.ForeignKey("case_studies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("value", sa.String(30), nullable=False),
        sa.Column("label", sa.String(80), nullable=False),
        sa.Column("period", sa.String(40), nullable=False),
        sa.Column("starting_value", sa.String(30), nullable=True),
        sa.Column("is_headline", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
    )
    op.create_table(
        "case_study_media",
        sa.Column("id", UUID, primary_key=True),
        sa.Column(
            "case_study_id",
            UUID,
            sa.ForeignKey("case_studies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("kind", media_kind, nullable=False),
        sa.Column("media_id", UUID, sa.ForeignKey("media.id"), nullable=False),
        sa.Column("video_url", sa.String(300), nullable=True),
        sa.Column("description", sa.String(200), nullable=True),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
    )
    op.create_table(
        "case_study_slug_history",
        sa.Column("old_slug", sa.String(80), primary_key=True),
        sa.Column(
            "case_study_id",
            UUID,
            sa.ForeignKey("case_studies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("created_at", TS, nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    for table in (
        "case_study_slug_history",
        "case_study_media",
        "case_study_results",
        "case_studies",
    ):
        op.drop_table(table)
    bind = op.get_bind()
    media_kind.drop(bind, checkfirst=True)
    industry.drop(bind, checkfirst=True)
