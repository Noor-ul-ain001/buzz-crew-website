"""Case studies (005): the story, measurable results, media and slug history."""

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlmodel import Field, SQLModel

from app.core import clock
from app.models.content import LEAD_COUNTRY
from app.models.lead import Country, Service, pg_enum
from app.models.publishable import TIMESTAMP, PublishableMixin

MAX_RESULTS = 6
MAX_HEADLINES = 3
MAX_IMAGES = 20
MAX_REELS = 5
MARKDOWN_LIMIT = 10_000


def _now() -> datetime:
    return clock.now()


class Industry(StrEnum):
    FOOD_BEVERAGES = "food_beverages"
    FARMHOUSES = "farmhouses"
    HEALTHCARE_DENTAL = "healthcare_dental"
    EDUCATION = "education"
    ECOMMERCE = "ecommerce"
    MEDIA_NEWS = "media_news"
    RETAIL = "retail"
    OTHER = "other"


class CaseStudyMediaKind(StrEnum):
    IMAGE = "image"
    REEL = "reel"


INDUSTRY = pg_enum(Industry, "case_study_industry")


def _media_fk() -> uuid.UUID | None:
    return Field(default=None, foreign_key="media.id", sa_type=UUID(as_uuid=True), nullable=True)  # pyright: ignore[reportReturnType]


class CaseStudy(PublishableMixin, table=True):
    __tablename__ = "case_studies"  # pyright: ignore[reportAssignmentType]

    slug: str = Field(sa_type=String(80), unique=True)
    client_name: str = Field(default="", sa_type=String(100))
    title: str = Field(default="", sa_type=String(120))
    summary: str = Field(default="", sa_type=String(200))
    industry: Industry | None = Field(default=None, sa_type=INDUSTRY, nullable=True)
    country: Country | None = Field(default=None, sa_type=LEAD_COUNTRY, nullable=True)
    services: list[Service] = Field(
        default_factory=lambda: list[Service](),
        sa_column=Column(
            ARRAY(pg_enum(Service, "lead_service")), nullable=False, server_default="{}"
        ),
    )
    challenge_md: str = Field(default="", sa_column=Column(Text, nullable=False, server_default=""))
    strategy_md: str = Field(default="", sa_column=Column(Text, nullable=False, server_default=""))
    execution_md: str = Field(default="", sa_column=Column(Text, nullable=False, server_default=""))
    project_period: str | None = Field(default=None, sa_type=String(40), nullable=True)
    cover_id: uuid.UUID | None = _media_fk()
    before_image_id: uuid.UUID | None = _media_fk()
    after_image_id: uuid.UUID | None = _media_fk()
    before_label: str = Field(default="Before", sa_type=String(30))
    after_label: str = Field(default="After", sa_type=String(30))
    testimonial_id: uuid.UUID | None = Field(
        default=None, foreign_key="testimonials.id", sa_type=UUID(as_uuid=True), nullable=True
    )
    seo_title: str | None = Field(default=None, sa_type=String(60), nullable=True)
    seo_description: str | None = Field(default=None, sa_type=String(160), nullable=True)


def _case_study_fk() -> uuid.UUID:
    return Field(  # pyright: ignore[reportReturnType]
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("case_studies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )


class CaseStudyResult(SQLModel, table=True):
    __tablename__ = "case_study_results"  # pyright: ignore[reportAssignmentType]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    case_study_id: uuid.UUID = _case_study_fk()
    value: str = Field(sa_column=Column(String(30), nullable=False))
    label: str = Field(sa_column=Column(String(80), nullable=False))
    period: str = Field(sa_column=Column(String(40), nullable=False))
    starting_value: str | None = Field(default=None, sa_column=Column(String(30), nullable=True))
    is_headline: bool = Field(default=False, sa_column=Column(Boolean, nullable=False))
    sort_order: int = Field(default=0, sa_column=Column(Integer, nullable=False))


class CaseStudyMedia(SQLModel, table=True):
    __tablename__ = "case_study_media"  # pyright: ignore[reportAssignmentType]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    case_study_id: uuid.UUID = _case_study_fk()
    kind: CaseStudyMediaKind = Field(
        sa_column=Column(pg_enum(CaseStudyMediaKind, "case_study_media_kind"), nullable=False)
    )
    # The image itself, or the reel's preview image.
    media_id: uuid.UUID = Field(foreign_key="media.id")
    video_url: str | None = Field(default=None, sa_column=Column(String(300), nullable=True))
    description: str | None = Field(default=None, sa_column=Column(String(200), nullable=True))
    sort_order: int = Field(default=0, sa_column=Column(Integer, nullable=False))


class CaseStudySlugHistory(SQLModel, table=True):
    """Old slugs of published case studies, so shared links keep working (301)."""

    __tablename__ = "case_study_slug_history"  # pyright: ignore[reportAssignmentType]

    old_slug: str = Field(sa_column=Column(String(80), primary_key=True))
    case_study_id: uuid.UUID = _case_study_fk()
    created_at: datetime = Field(default_factory=_now, sa_type=TIMESTAMP)
