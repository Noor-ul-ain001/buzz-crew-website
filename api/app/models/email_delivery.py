import uuid
from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field, SQLModel

from app.models.lead import pg_enum


class EmailKind(StrEnum):
    TEAM_NOTIFICATION = "team_notification"
    CLIENT_CONFIRMATION = "client_confirmation"


class EmailStatus(StrEnum):
    SENT = "sent"
    FAILED = "failed"


class EmailDelivery(SQLModel, table=True):
    """Whether each email for a lead was sent or failed, and when (FR-015)."""

    __tablename__ = "email_deliveries"  # pyright: ignore[reportAssignmentType]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4, sa_column=Column(UUID(as_uuid=True), primary_key=True)
    )
    lead_id: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("leads.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    kind: EmailKind = Field(sa_column=Column(pg_enum(EmailKind, "email_kind"), nullable=False))
    status: EmailStatus = Field(
        sa_column=Column(pg_enum(EmailStatus, "email_status"), nullable=False)
    )
    provider_message_id: str | None = Field(
        default=None, sa_column=Column(String(100), nullable=True)
    )
    # Short machine code only; never the email address or provider message text.
    error_code: str | None = Field(default=None, sa_column=Column(String(60), nullable=True))
    attempted_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
