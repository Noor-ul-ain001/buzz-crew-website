"""Media rows for images that ship with the web app in /public (seed data only).

They're recorded with a `static:` id, so cleanup and deletes never touch Cloudinary.
"""

from pathlib import Path

from PIL import Image
from sqlmodel import Session

from app.models.media import Media, MediaMime
from app.services.media_store import STATIC_PREFIX

WEB_PUBLIC = Path(__file__).resolve().parents[3] / "web" / "public"
MIMES = {"WEBP": MediaMime.WEBP, "PNG": MediaMime.PNG, "JPEG": MediaMime.JPEG}


def static_media(session: Session, public_path: str, alt: str) -> Media:
    """`public_path` is relative to web/public, e.g. "/home/camera.webp"."""
    path = WEB_PUBLIC / public_path.lstrip("/")
    with Image.open(path) as image:
        width, height = image.size
        mime = MIMES[image.format or "WEBP"]
    media = Media(
        provider_public_id=f"{STATIC_PREFIX}{public_path}",
        url=public_path,
        alt_text=alt,
        original_filename=path.name,
        mime_type=mime,
        width=width,
        height=height,
        size_bytes=path.stat().st_size,
    )
    session.add(media)
    session.flush()
    return media
