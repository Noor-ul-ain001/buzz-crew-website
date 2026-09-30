import uuid
from datetime import UTC, datetime
from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, StringConstraints, field_validator
from pydantic import Field as PydanticField
from sqlalchemy import CHAR, Column, DateTime, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlmodel import Field, SQLModel


class Country(StrEnum):
    PAKISTAN = "pakistan"
    UAE = "uae"
    UK = "uk"
    OTHER = "other"


class Service(StrEnum):
    SOCIAL_MEDIA = "social_media"
    SEO = "seo"
    WEB_SOFTWARE = "web_software"
    UI_UX_DESIGN = "ui_ux_design"
    META_ADS = "meta_ads"


class BudgetRange(StrEnum):
    UNDER_50K = "under_50k"
    FROM_50K_TO_150K = "50k_150k"
    OVER_150K = "150k_plus"
    NOT_SURE = "not_sure"


class LeadStatus(StrEnum):
    NEW = "new"
    CONTACTED = "contacted"
    PROPOSAL_SENT = "proposal_sent"
    WON = "won"
    LOST = "lost"


def _enum_values(members: type[StrEnum]) -> list[str]:
    return [member.value for member in members]


def pg_enum(enum: type[StrEnum], name: str) -> SAEnum:
    """Store the lowercase values (not member names) in a named Postgres enum type."""
    return SAEnum(enum, name=name, values_callable=_enum_values)


class Lead(SQLModel, table=True):
    __tablename__ = "leads"  # pyright: ignore[reportAssignmentType]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4, sa_column=Column(UUID(as_uuid=True), primary_key=True)
    )
    name: str = Field(sa_column=Column(String(100), nullable=False))
    email: str = Field(sa_column=Column(String(254), nullable=False))
    phone: str | None = Field(default=None, sa_column=Column(String(20), nullable=True))
    business: str | None = Field(default=None, sa_column=Column(String(150), nullable=True))
    country: Country = Field(sa_column=Column(pg_enum(Country, "lead_country"), nullable=False))
    services: list[Service] = Field(
        sa_column=Column(ARRAY(pg_enum(Service, "lead_service")), nullable=False)
    )
    budget_range: BudgetRange = Field(
        sa_column=Column(pg_enum(BudgetRange, "lead_budget_range"), nullable=False)
    )
    message: str = Field(sa_column=Column(Text, nullable=False))
    status: LeadStatus = Field(
        default=LeadStatus.NEW,
        sa_column=Column(pg_enum(LeadStatus, "lead_status"), nullable=False, server_default="new"),
    )
    source: str = Field(
        default="contact_form",
        sa_column=Column(String(40), nullable=False, server_default="contact_form"),
    )
    source_page: str = Field(sa_column=Column(String(200), nullable=False))
    idempotency_key: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), nullable=False, unique=True)
    )
    post_process_token_hash: str | None = Field(
        default=None, sa_column=Column(CHAR(64), nullable=True)
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
    deleted_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )


Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Message = Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=2000)]
Phone = Annotated[str, StringConstraints(strip_whitespace=True, pattern=r"^\+?[\d\s()-]{7,20}$")]
Business = Annotated[str, StringConstraints(strip_whitespace=True, max_length=150)]
SourcePage = Annotated[str, StringConstraints(max_length=200, pattern=r"^/")]


class LeadCreate(BaseModel):
    """Public inquiry payload. Validation here is the source of truth (research R8)."""

    model_config = ConfigDict(extra="forbid")

    name: Name
    email: Annotated[EmailStr, StringConstraints(max_length=254)]
    phone: Phone | None = None
    business: Business | None = None
    country: Country
    services: list[Service] = PydanticField(min_length=1)
    budget_range: BudgetRange
    message: Message
    source_page: SourcePage
    idempotency_key: uuid.UUID
    website: str | None = PydanticField(
        default=None, description="Honeypot; must be empty or absent"
    )

    @field_validator("email")
    @classmethod
    def lower_email(cls, value: str) -> str:
        return value.lower()

    @field_validator("business")
    @classmethod
    def blank_business_is_none(cls, value: str | None) -> str | None:
        return value or None

    @field_validator("services")
    @classmethod
    def unique_services(cls, value: list[Service]) -> list[Service]:
        if len(set(value)) != len(value):
            raise ValueError("Each service can only be chosen once.")
        return value

    @field_validator("website")
    @classmethod
    def honeypot_empty(cls, value: str | None) -> str | None:
        if value:
            raise ValueError("Invalid submission.")
        return None


class LeadCreated(BaseModel):
    id: uuid.UUID
    status: LeadStatus
    created_at: datetime
    post_process_token: str
