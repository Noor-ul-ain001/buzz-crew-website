"""Signed direct uploads and server-side checks for images (004 US2, DEPLOYMENT D6).

The browser uploads to a temporary Cloudinary folder; `finalize` then applies every rule on
the server: size, the real file type, dimensions, and EXIF/GPS removal by re-encoding.
"""

import io
import uuid
from dataclasses import dataclass, field
from enum import StrEnum
from pathlib import PurePosixPath

import structlog
from fastapi import HTTPException, status
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlmodel import Session

from app.core.config import get_settings
from app.models.media import MAX_UPLOAD_BYTES, Media, MediaMime
from app.services.media_store import STATIC_PREFIX, get_store

log = structlog.get_logger()


class ImageUsage(StrEnum):
    PHOTO = "photo"
    LOGO = "logo"


# (min width, min height): smaller images are accepted with a warning.
MIN_SIZE = {ImageUsage.PHOTO: (400, 400), ImageUsage.LOGO: (200, 0)}
FORMATS = {"JPEG": MediaMime.JPEG, "PNG": MediaMime.PNG, "WEBP": MediaMime.WEBP}
UNSUPPORTED_IMAGE = "Please choose a JPEG, PNG or WebP image"


@dataclass
class Finalized:
    media: Media
    warnings: list[str] = field(default_factory=lambda: list[str]())


def tmp_folder() -> str:
    return f"{get_settings().cloudinary_folder}/tmp"  # noqa: S108 - a Cloudinary folder


def sign_upload(usage: ImageUsage) -> dict[str, object]:
    del usage  # every image usage shares the tmp folder; the final folder is set on finalize
    return get_store().sign(tmp_folder(), uuid.uuid4().hex)


def _reencode(data: bytes) -> tuple[bytes, MediaMime, int, int]:
    """Decode the real content and write a clean copy without metadata (keeps transparency)."""
    try:
        with Image.open(io.BytesIO(data)) as probe:
            fmt = probe.format or ""
            probe.verify()
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
        fmt = ""
    if fmt not in FORMATS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={"code": "unsupported_type", "message": UNSUPPORTED_IMAGE},
        )

    with Image.open(io.BytesIO(data)) as source:
        image = ImageOps.exif_transpose(source)
        out = io.BytesIO()
        if fmt == "JPEG":
            image.convert("RGB").save(out, "JPEG", quality=88, optimize=True)
        elif fmt == "PNG":
            image.save(out, "PNG", optimize=True)
        else:
            image.save(out, "WEBP", quality=88)
        return out.getvalue(), FORMATS[fmt], image.width, image.height


def finalize(
    session: Session,
    *,
    public_id: str,
    usage: ImageUsage,
    alt_text: str | None,
    original_filename: str,
    uploaded_by: uuid.UUID | None,
) -> Finalized:
    if not public_id.startswith(f"{tmp_folder()}/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "invalid_upload", "message": "That upload can't be used."},
        )
    store = get_store()
    data = store.download(public_id)
    try:
        if len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail={
                    "code": "file_too_large",
                    "message": "Please choose an image under 5 MB.",
                    "size_bytes": len(data),
                    "limit_bytes": MAX_UPLOAD_BYTES,
                },
            )
        cleaned, mime, width, height = _reencode(data)
    finally:
        # The temporary copy (with its original metadata) never outlives this request.
        store.delete(public_id)

    final_id = PurePosixPath(public_id).name
    url = store.upload(cleaned, f"{get_settings().cloudinary_folder}/{usage.value}", final_id)
    media = Media(
        provider_public_id=f"{get_settings().cloudinary_folder}/{usage.value}/{final_id}",
        url=url,
        alt_text=(alt_text or "").strip() or None,
        original_filename=original_filename[:255] or "image",
        mime_type=mime,
        width=width,
        height=height,
        size_bytes=len(cleaned),
        uploaded_by=uploaded_by,
    )
    session.add(media)
    session.commit()
    session.refresh(media)

    min_width, min_height = MIN_SIZE[usage]
    warnings = ["below_min_size"] if width < min_width or height < min_height else []
    return Finalized(media=media, warnings=warnings)


def purge(session: Session, media_id: uuid.UUID | None) -> None:
    """Delete an image everywhere. Used when its owning item is deleted."""
    if media_id is None:
        return
    media = session.get(Media, media_id)
    if media is None:
        return
    if not media.provider_public_id.startswith(STATIC_PREFIX):
        try:
            get_store().delete(media.provider_public_id)
        except Exception as error:  # noqa: BLE001 - cleanup job retries orphans later
            log.warning("media_purge_failed", error_type=type(error).__name__)
    session.delete(media)


def alt_text_problem(media: Media | None) -> str | None:
    """Why this image can't be published yet, or None."""
    if media is None:
        return None
    alt = (media.alt_text or "").strip()
    if len(alt) < 5:
        return "Describe what the image shows (at least 5 characters)."
    name = media.original_filename.strip().lower()
    if alt.lower() in {name, PurePosixPath(name).stem}:
        return "Describe what the image shows, not its file name."
    return None
