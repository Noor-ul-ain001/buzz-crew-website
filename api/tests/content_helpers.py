from typing import Any

from tests.conftest import FakeMediaStore
from tests.fixtures.images import logo_png, photo_ok_jpg

TMP = "buzzcrew/tmp"


def upload(
    client: Any,
    store: FakeMediaStore,
    data: bytes | None = None,
    *,
    usage: str = "photo",
    alt: str | None = "A smiling client standing in her bakery",
    filename: str = "photo.jpg",
    name: str = "upload1",
) -> Any:
    store.tmp[f"{TMP}/{name}"] = (
        data if data is not None else (logo_png() if usage == "logo" else photo_ok_jpg())
    )
    body: dict[str, Any] = {
        "public_id": f"{TMP}/{name}",
        "usage": usage,
        "original_filename": filename,
    }
    if alt is not None:
        body["alt_text"] = alt
    return client.post("/api/v1/uploads/finalize", json=body)


def sample_testimonial(**overrides: Any) -> dict[str, Any]:
    body: dict[str, Any] = {
        "name": "Ayesha",
        "role": "Founder",
        "company": "Halki Aanch",
        "country": "pakistan",
        "quote": "The content they made elevated my food campaign beyond expectations.",
    }
    body.update(overrides)
    return body


def create(client: Any, slug: str, body: dict[str, Any]) -> dict[str, Any]:
    response = client.post(f"/api/v1/admin/content/{slug}", json=body)
    assert response.status_code == 201, response.text
    return response.json()


def publish(client: Any, slug: str, item_id: str) -> Any:
    return client.post(f"/api/v1/admin/content/{slug}/{item_id}/publish")
