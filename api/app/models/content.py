"""Testimonials, client logos, team members (004), FAQs and blog posts (006, 007)."""

import uuid
from typing import Any

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlmodel import Field

from app.models.lead import Country, pg_enum
from app.models.publishable import PublishableMixin

LEAD_COUNTRY = pg_enum(Country, "lead_country")


def _media_fk(nullable: bool = True) -> Any:
    return Field(
        default=None,
        foreign_key="media.id",
        sa_type=UUID(as_uuid=True),
        nullable=nullable,
    )


class Testimonial(PublishableMixin, table=True):
    __tablename__ = "testimonials"  # pyright: ignore[reportAssignmentType]

    name: str = Field(default="", sa_type=String(100))
    role: str = Field(default="", sa_type=String(100))
    company: str = Field(default="", sa_type=String(100))
    country: Country | None = Field(default=None, sa_type=LEAD_COUNTRY, nullable=True)
    quote: str = Field(default="", sa_type=String(400))
    photo_id: uuid.UUID | None = _media_fk()
    video_url: str | None = Field(default=None, sa_type=String(300), nullable=True)


class ClientLogo(PublishableMixin, table=True):
    __tablename__ = "client_logos"  # pyright: ignore[reportAssignmentType]

    name: str = Field(default="", sa_type=String(100))
    # Required to publish; nullable so a draft can be saved before the upload.
    logo_id: uuid.UUID | None = _media_fk()
    website_url: str | None = Field(default=None, sa_type=String(300), nullable=True)


class TeamMember(PublishableMixin, table=True):
    __tablename__ = "team_members"  # pyright: ignore[reportAssignmentType]

    name: str = Field(default="", sa_type=String(100))
    role: str = Field(default="", sa_type=String(100))
    bio: str = Field(default="", sa_type=String(300))
    photo_id: uuid.UUID | None = _media_fk()


class Faq(PublishableMixin, table=True):
    __tablename__ = "faqs"  # pyright: ignore[reportAssignmentType]

    group: str = Field(default="", sa_type=String(60))
    question: str = Field(default="", sa_type=String(200))
    answer: str = Field(default="", sa_type=Text)


class Post(PublishableMixin, table=True):
    __tablename__ = "posts"  # pyright: ignore[reportAssignmentType]

    # Nullable so several drafts can exist before each gets its address.
    slug: str | None = Field(default=None, sa_type=String(80), nullable=True, unique=True)
    title: str = Field(default="", sa_type=String(120))
    excerpt: str = Field(default="", sa_type=String(300))
    body_md: str = Field(default="", sa_type=Text)
    cover_id: uuid.UUID | None = _media_fk()
    author_name: str = Field(default="", sa_type=String(100))
    author_role: str = Field(default="", sa_type=String(100))
    category: str = Field(default="", sa_type=String(40))
    tags: list[str] = Field(default_factory=lambda: list[str](), sa_type=ARRAY(String(40)))
    reading_minutes: int = Field(default=1)
    seo_title: str = Field(default="", sa_type=String(60))
    seo_description: str = Field(default="", sa_type=String(160))
