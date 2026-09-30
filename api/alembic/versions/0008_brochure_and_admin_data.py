"""brochure services; lead notes and history; FAQs, posts and newsletter subscribers

Revision ID: 0008
Revises: 0007
Create Date: 2026-09-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0008"
down_revision: str | Sequence[str] | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

UUID = postgresql.UUID(as_uuid=True)
TS = sa.DateTime(timezone=True)

NEW_SERVICES = (
    "digital_marketing",
    "creative_design",
    "web_software",
    "ui_ux_design",
    "video_content",
    "public_relations",
    "branding",
    "copywriting",
    "ai_automation",
    "iot_smart",
)
OLD_SERVICES = ("social_media", "seo", "web_software", "ui_ux_design", "meta_ads")
# Social media, SEO and Meta Ads all sit under "Digital Marketing" in the brochure.
TO_NEW = {
    "social_media": "digital_marketing",
    "seo": "digital_marketing",
    "meta_ads": "digital_marketing",
}
TO_OLD = {"digital_marketing": "social_media"}

publish_status = postgresql.ENUM(name="publish_status", create_type=False)
lead_status = postgresql.ENUM(name="lead_status", create_type=False)


def _swap_services(values: Sequence[str], mapping: dict[str, str]) -> None:
    """Replace the lead_service enum, mapping each old value (unknown ones are dropped)."""
    labels = ", ".join(f"'{v}'" for v in values)
    cases = " ".join(f"WHEN '{old}' THEN '{new}'" for old, new in mapping.items())
    op.execute(f"CREATE TYPE lead_service_next AS ENUM ({labels})")
    # ALTER COLUMN ... USING can't hold a subquery, so the mapping lives in a function.
    # The SQL is built only from the constant service names above, never from input.
    op.execute(
        f"""
        CREATE FUNCTION pg_temp.map_services(old lead_service[]) RETURNS lead_service_next[]
        LANGUAGE sql IMMUTABLE AS $$
            SELECT COALESCE(array_agg(DISTINCT mapped::lead_service_next), '{{}}')
            FROM (SELECT CASE s::text {cases} ELSE s::text END AS mapped FROM unnest(old) s) m
            WHERE mapped IN ({labels})
        $$
        """  # noqa: S608
    )
    op.execute("ALTER TABLE case_studies ALTER COLUMN services DROP DEFAULT")
    for table in ("leads", "case_studies"):
        op.execute(
            f"ALTER TABLE {table} ALTER COLUMN services TYPE lead_service_next[] "
            "USING pg_temp.map_services(services)"
        )
    op.execute("DROP FUNCTION pg_temp.map_services(lead_service[])")
    op.execute("DROP TYPE lead_service")
    op.execute("ALTER TYPE lead_service_next RENAME TO lead_service")
    op.execute("ALTER TABLE case_studies ALTER COLUMN services SET DEFAULT '{}'")


def publishable_columns() -> list[sa.Column[object]]:
    return [
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
    ]


def upgrade() -> None:
    _swap_services(NEW_SERVICES, TO_NEW)

    op.create_table(
        "lead_notes",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("lead_id", UUID, sa.ForeignKey("leads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", UUID, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("author_name", sa.String(100), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("created_at", TS, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_lead_notes_lead_id", "lead_notes", ["lead_id"])
    op.create_table(
        "lead_events",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("lead_id", UUID, sa.ForeignKey("leads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("from_status", lead_status, nullable=True),
        sa.Column("to_status", lead_status, nullable=False),
        sa.Column("actor_name", sa.String(100), nullable=False),
        sa.Column("created_at", TS, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_lead_events_lead_id", "lead_events", ["lead_id"])
    # Every existing lead gets the "received" event its history starts with.
    op.execute(
        "INSERT INTO lead_events (id, lead_id, from_status, to_status, actor_name, created_at) "
        "SELECT gen_random_uuid(), id, NULL, 'new', 'Website form', created_at FROM leads"
    )

    op.create_table(
        "faqs",
        *publishable_columns(),
        sa.Column("group", sa.String(60), nullable=False, server_default=""),
        sa.Column("question", sa.String(200), nullable=False, server_default=""),
        sa.Column("answer", sa.Text, nullable=False, server_default=""),
    )
    op.create_table(
        "posts",
        *publishable_columns(),
        sa.Column("slug", sa.String(80), nullable=True, unique=True),
        sa.Column("title", sa.String(120), nullable=False, server_default=""),
        sa.Column("excerpt", sa.String(300), nullable=False, server_default=""),
        sa.Column("body_md", sa.Text, nullable=False, server_default=""),
        sa.Column("cover_id", UUID, sa.ForeignKey("media.id"), nullable=True),
        sa.Column("author_name", sa.String(100), nullable=False, server_default=""),
        sa.Column("author_role", sa.String(100), nullable=False, server_default=""),
        sa.Column("category", sa.String(40), nullable=False, server_default=""),
        sa.Column("tags", postgresql.ARRAY(sa.String(40)), nullable=False, server_default="{}"),
        sa.Column("reading_minutes", sa.Integer, nullable=False, server_default="1"),
        sa.Column("seo_title", sa.String(60), nullable=False, server_default=""),
        sa.Column("seo_description", sa.String(160), nullable=False, server_default=""),
    )
    op.create_table(
        "newsletter_subscribers",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("email", sa.String(254), nullable=False, unique=True),
        sa.Column("source_page", sa.String(200), nullable=False, server_default="/"),
        sa.Column("created_at", TS, nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    for table in ("newsletter_subscribers", "posts", "faqs", "lead_events", "lead_notes"):
        op.drop_table(table)
    _swap_services(OLD_SERVICES, TO_OLD)
