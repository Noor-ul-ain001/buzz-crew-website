"""content: publishing pattern, media, testimonials, client logos, team members (004)

Revision ID: 0005
Revises: 0004
Create Date: 2026-09-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0005"
down_revision: str | Sequence[str] | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

publish_status = postgresql.ENUM("draft", "published", name="publish_status", create_type=False)
content_action = postgresql.ENUM(
    "created",
    "updated",
    "published",
    "unpublished",
    "reordered",
    "deleted",
    name="content_action",
    create_type=False,
)
media_mime = postgresql.ENUM(
    "image/jpeg", "image/png", "image/webp", name="media_mime", create_type=False
)
lead_country = postgresql.ENUM(name="lead_country", create_type=False)

UUID = postgresql.UUID(as_uuid=True)
TS = sa.DateTime(timezone=True)


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
    bind = op.get_bind()
    for enum in (publish_status, content_action, media_mime):
        enum.create(bind, checkfirst=True)

    op.create_table(
        "media",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("provider_public_id", sa.String(255), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("alt_text", sa.String(150), nullable=True),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("mime_type", media_mime, nullable=False),
        sa.Column("width", sa.Integer, nullable=False),
        sa.Column("height", sa.Integer, nullable=False),
        sa.Column("size_bytes", sa.Integer, nullable=False),
        sa.Column("uploaded_by", UUID, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", TS, nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("size_bytes <= 5242880", name="ck_media_size"),
    )
    op.create_index("ix_media_created_at", "media", ["created_at"])

    op.create_table(
        "content_activity",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("content_type", sa.String(40), nullable=False),
        sa.Column("content_id", UUID, nullable=False),
        sa.Column("action", content_action, nullable=False),
        sa.Column("actor_id", UUID, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", TS, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_content_activity_content_id", "content_activity", ["content_id"])

    op.create_table(
        "testimonials",
        *publishable_columns(),
        sa.Column("name", sa.String(100), nullable=False, server_default=""),
        sa.Column("role", sa.String(100), nullable=False, server_default=""),
        sa.Column("company", sa.String(100), nullable=False, server_default=""),
        sa.Column("country", lead_country, nullable=True),
        sa.Column("quote", sa.String(400), nullable=False, server_default=""),
        sa.Column("photo_id", UUID, sa.ForeignKey("media.id"), nullable=True),
        sa.Column("video_url", sa.String(300), nullable=True),
    )
    op.create_table(
        "client_logos",
        *publishable_columns(),
        sa.Column("name", sa.String(100), nullable=False, server_default=""),
        sa.Column("logo_id", UUID, sa.ForeignKey("media.id"), nullable=True),
        sa.Column("website_url", sa.String(300), nullable=True),
    )
    op.create_table(
        "team_members",
        *publishable_columns(),
        sa.Column("name", sa.String(100), nullable=False, server_default=""),
        sa.Column("role", sa.String(100), nullable=False, server_default=""),
        sa.Column("bio", sa.String(300), nullable=False, server_default=""),
        sa.Column("photo_id", UUID, sa.ForeignKey("media.id"), nullable=True),
    )
    for table in ("testimonials", "client_logos", "team_members"):
        op.create_index(
            f"ix_{table}_public",
            table,
            ["sort_order"],
            postgresql_where=sa.text("status = 'published' AND deleted_at IS NULL"),
        )


def downgrade() -> None:
    for table in ("team_members", "client_logos", "testimonials", "content_activity", "media"):
        op.drop_table(table)
    bind = op.get_bind()
    for enum in (media_mime, content_action, publish_status):
        enum.drop(bind, checkfirst=True)
