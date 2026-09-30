"""Where image files live. Cloudinary in every environment (free plan, DEPLOYMENT D6);
tests swap in a fake with `set_store()`."""

import time
from datetime import datetime
from typing import Any, Protocol

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings

# Seeded brochure images are served from the web app's /public folder, not Cloudinary.
STATIC_PREFIX = "static:"


class MediaStore(Protocol):
    def sign(self, folder: str, public_id: str) -> dict[str, Any]: ...
    def download(self, public_id: str) -> bytes: ...
    def upload(self, data: bytes, folder: str, public_id: str) -> str:
        """Store the file; return its delivery URL."""
        ...

    def delete(self, public_id: str) -> None: ...
    def delete_older_than(self, prefix: str, cutoff: datetime) -> int:
        """Delete files under `prefix` uploaded before `cutoff`; return how many."""
        ...


class CloudinaryStore:
    def __init__(self, cloudinary_url: str) -> None:
        import cloudinary  # pyright: ignore[reportMissingTypeStubs]

        cloudinary.config(cloudinary_url=cloudinary_url, secure=True)  # pyright: ignore[reportUnknownMemberType]
        self._config: Any = cloudinary.config()  # pyright: ignore[reportUnknownMemberType]

    def sign(self, folder: str, public_id: str) -> dict[str, Any]:
        from cloudinary.utils import (  # pyright: ignore[reportMissingTypeStubs]
            api_sign_request,  # pyright: ignore[reportUnknownVariableType]
        )

        params: dict[str, Any] = {
            "timestamp": int(time.time()),
            "folder": folder,
            "public_id": public_id,
            "allowed_formats": "jpg,png,webp",
        }
        signature: str = api_sign_request(params, self._config.api_secret)  # pyright: ignore[reportUnknownVariableType]
        return {
            **params,
            "signature": signature,
            "api_key": self._config.api_key,
            "upload_url": f"https://api.cloudinary.com/v1_1/{self._config.cloud_name}/image/upload",
            "resource_type": "image",
            "type": "upload",
        }

    def download(self, public_id: str) -> bytes:
        import cloudinary.api  # pyright: ignore[reportMissingTypeStubs]

        resource: Any = cloudinary.api.resource(public_id)  # pyright: ignore[reportUnknownMemberType]
        response = httpx.get(str(resource["secure_url"]), timeout=20)
        response.raise_for_status()
        return response.content

    def upload(self, data: bytes, folder: str, public_id: str) -> str:
        import cloudinary.uploader  # pyright: ignore[reportMissingTypeStubs]

        result: Any = cloudinary.uploader.upload(  # pyright: ignore[reportUnknownMemberType]
            data, folder=folder, public_id=public_id, overwrite=False, resource_type="image"
        )
        return str(result["secure_url"])

    def delete(self, public_id: str) -> None:
        import cloudinary.uploader  # pyright: ignore[reportMissingTypeStubs]

        cloudinary.uploader.destroy(public_id, invalidate=True)  # pyright: ignore[reportUnknownMemberType]

    def delete_older_than(self, prefix: str, cutoff: datetime) -> int:
        import cloudinary.api  # pyright: ignore[reportMissingTypeStubs]

        listing: Any = cloudinary.api.resources(  # pyright: ignore[reportUnknownMemberType]
            type="upload", prefix=prefix, max_results=500
        )
        removed = 0
        for resource in listing.get("resources", []):
            created = datetime.fromisoformat(str(resource["created_at"]).replace("Z", "+00:00"))
            if created < cutoff:
                self.delete(str(resource["public_id"]))
                removed += 1
        return removed


_store: MediaStore | None = None


def set_store(store: MediaStore | None) -> None:
    global _store
    _store = store


def get_store() -> MediaStore:
    global _store
    if _store is None:
        url = get_settings().cloudinary_url
        if not url:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "code": "uploads_not_configured",
                    "message": "Image uploads aren't set up yet. Add CLOUDINARY_URL to the API.",
                },
            )
        _store = CloudinaryStore(url)
    return _store
