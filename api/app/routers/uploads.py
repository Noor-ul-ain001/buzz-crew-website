"""Signed direct uploads to Cloudinary and their server-side finalisation (004 US2, D6)."""

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.core.auth import Staff, staff_router
from app.core.database import get_session
from app.models.media import Media
from app.services import media_service
from app.services.content_types import MediaOut, media_out
from app.services.media_service import ImageUsage

router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])
media_router = staff_router(prefix="/api/v1/admin/media", tags=["uploads"])

DbSession = Annotated[Session, Depends(get_session)]


class SignatureRequest(BaseModel):
    usage: ImageUsage


class FinalizeRequest(BaseModel):
    public_id: str = Field(min_length=1, max_length=255)
    usage: ImageUsage
    alt_text: str | None = Field(default=None, max_length=150)
    original_filename: str = Field(default="image", max_length=255)


class AltTextUpdate(BaseModel):
    alt_text: str = Field(max_length=150)


@router.post("/signature", operation_id="createUploadSignature")
def create_signature(data: SignatureRequest, current: Staff) -> dict[str, Any]:
    del current  # photo and logo uploads are for signed-in staff only
    return media_service.sign_upload(data.usage)


@router.post(
    "/finalize",
    status_code=status.HTTP_201_CREATED,
    response_model=MediaOut,
    operation_id="finalizeUpload",
    responses={
        413: {"description": "file_too_large (size_bytes, limit_bytes)"},
        415: {"description": "unsupported_type"},
    },
)
def finalize(data: FinalizeRequest, current: Staff, session: DbSession) -> MediaOut:
    result = media_service.finalize(
        session,
        public_id=data.public_id,
        usage=data.usage,
        alt_text=data.alt_text,
        original_filename=data.original_filename,
        uploaded_by=current.user.id,
    )
    out = media_out(result.media)
    assert out is not None
    out.warnings = result.warnings
    return out


@media_router.patch("/{media_id}", response_model=MediaOut, operation_id="updateMediaAlt")
def update_alt_text(media_id: uuid.UUID, data: AltTextUpdate, session: DbSession) -> MediaOut:
    media = session.get(Media, media_id)
    if media is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "No such image."},
        )
    media.alt_text = data.alt_text.strip() or None
    session.add(media)
    session.commit()
    session.refresh(media)
    out = media_out(media)
    assert out is not None
    return out
