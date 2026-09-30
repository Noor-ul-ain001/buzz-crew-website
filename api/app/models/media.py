import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlmodel import Field, SQLModel

from app.core import clock
from app.models.lead import pg_enum
from app.models.publishable import TIMESTAMP

MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def _now() -> datetime:
    return clock.now()


class MediaMime(StrEnum):
    JPEG = "image/jpeg"
    PNG = "image/png"
    WEBP = "image/webp"


class Media(SQLModel, table=True):
    """An uploaded image, stored cleaned (no EXIF) in its final Cloudinary folder."""

    __tablename__ = "media"  # pyright: ignore[reportAssignmentType]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4, sa_column=Column(UUID(as_uuid=True), primary_key=True)
    )
    provider_public_id: str = Field(sa_column=Column(String(255), nullable=False))
    url: str = Field(sa_column=Column(String(500), nullable=False))
    # Required (5–150 characters, not the file name) before the owning item can publish.
    alt_text: str | None = Field(default=None, sa_column=Column(String(150), nullable=True))
    original_filename: str = Field(sa_column=Column(String(255), nullable=False))
    mime_type: MediaMime = Field(sa_column=Column(pg_enum(MediaMime, "media_mime"), nullable=False))
    width: int = Field(sa_column=Column(Integer, nullable=False))
    height: int = Field(sa_column=Column(Integer, nullable=False))
    size_bytes: int = Field(sa_column=Column(Integer, nullable=False))
    uploaded_by: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=_now, sa_type=TIMESTAMP)
