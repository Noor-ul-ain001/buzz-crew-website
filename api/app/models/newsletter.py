"""Newsletter sign-ups from the site footer, listed in the admin area."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field, SQLModel


class NewsletterSubscriber(SQLModel, table=True):
    __tablename__ = "newsletter_subscribers"  # pyright: ignore[reportAssignmentType]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4, sa_column=Column(UUID(as_uuid=True), primary_key=True)
    )
    email: str = Field(sa_column=Column(String(254), nullable=False, unique=True))
    source_page: str = Field(
        default="/", sa_column=Column(String(200), nullable=False, server_default="/")
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
