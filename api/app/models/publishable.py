"""The reusable publishing pattern (004 Phase 2), shared by features 005 and 007.

Columns use `sa_type` rather than `sa_column` so each table that inherits the mixin gets its
own Column objects.
"""

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import BigInteger, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field, SQLModel

from app.core import clock
from app.models.lead import pg_enum


def _now() -> datetime:
    return clock.now()


class PublishStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"


class ContentAction(StrEnum):
    CREATED = "created"
    UPDATED = "updated"
    PUBLISHED = "published"
    UNPUBLISHED = "unpublished"
    REORDERED = "reordered"
    DELETED = "deleted"


PUBLISH_STATUS = pg_enum(PublishStatus, "publish_status")
TIMESTAMP = DateTime(timezone=True)


class PublishableMixin(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, sa_type=UUID(as_uuid=True))
    status: PublishStatus = Field(default=PublishStatus.DRAFT, sa_type=PUBLISH_STATUS)
    sort_order: int = Field(default=0)
    # Optimistic lock: starts at 1 and goes up on every change.
    version: int = Field(default=1)
    published_at: datetime | None = Field(default=None, sa_type=TIMESTAMP)
    last_published_at: datetime | None = Field(default=None, sa_type=TIMESTAMP)
    created_by: uuid.UUID | None = Field(
        default=None, foreign_key="users.id", sa_type=UUID(as_uuid=True)
    )
    updated_by: uuid.UUID | None = Field(
        default=None, foreign_key="users.id", sa_type=UUID(as_uuid=True)
    )
    created_at: datetime = Field(default_factory=_now, sa_type=TIMESTAMP)
    updated_at: datetime = Field(default_factory=_now, sa_type=TIMESTAMP)
    # Soft delete: hidden from the admin area and public endpoints.
    deleted_at: datetime | None = Field(default=None, sa_type=TIMESTAMP)


class ContentActivity(SQLModel, table=True):
    __tablename__ = "content_activity"  # pyright: ignore[reportAssignmentType]

    id: int | None = Field(default=None, sa_column=Column(BigInteger, primary_key=True))
    content_type: str = Field(sa_column=Column(String(40), nullable=False))
    content_id: uuid.UUID = Field(sa_column=Column(UUID(as_uuid=True), nullable=False, index=True))
    action: ContentAction = Field(
        sa_column=Column(pg_enum(ContentAction, "content_action"), nullable=False)
    )
    actor_id: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=_now, sa_type=TIMESTAMP)
