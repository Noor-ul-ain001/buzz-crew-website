from pathlib import Path
from typing import Any

import yaml  # pyright: ignore[reportMissingModuleSource]

from tests.conftest import FakeMediaStore
from tests.content_helpers import create, publish, sample_testimonial, upload

SLUG = "testimonials"
BASE = f"/api/v1/admin/content/{SLUG}"
CONTRACT = (
    Path(__file__).resolve().parents[2]
    / "specs"
    / "004-content-publishing"
    / "contracts"
    / "content.openapi.yaml"
)


def schema(name: str) -> dict[str, Any]:
    return yaml.safe_load(CONTRACT.read_text(encoding="utf-8"))["components"]["schemas"][name]


def test_field_limits(editor_client: Any) -> None:
    assert editor_client.post(BASE, json={"name": "x" * 101}).status_code == 422
    assert editor_client.post(BASE, json={"name": "A", "country": "france"}).status_code == 422
    assert editor_client.post(BASE, json={"name": "A", "quote": "q" * 401}).status_code == 422


def test_quote_needs_twenty_characters_to_publish(editor_client: Any) -> None:
    item = create(editor_client, SLUG, sample_testimonial(quote="Nice work, thanks"))
    response = publish(editor_client, SLUG, item["id"])
    assert response.json()["detail"]["fields"]["quote"] == "Quote must be at least 20 characters."


def test_photo_alt_text_needed_only_with_a_photo(
    editor_client: Any, media_store: FakeMediaStore
) -> None:
    no_photo = create(editor_client, SLUG, sample_testimonial())
    assert publish(editor_client, SLUG, no_photo["id"]).status_code == 200

    media = upload(editor_client, media_store, alt=None).json()
    with_photo = create(editor_client, SLUG, sample_testimonial(photo_id=media["id"]))
    refused = publish(editor_client, SLUG, with_photo["id"])
    assert refused.status_code == 422
    assert "photo.alt_text" in refused.json()["detail"]["fields"]

    editor_client.patch(
        f"/api/v1/admin/media/{media['id']}", json={"alt_text": "Ayesha smiling in her kitchen"}
    )
    assert publish(editor_client, SLUG, with_photo["id"]).status_code == 200


def test_video_url_allowlist(editor_client: Any) -> None:
    response = editor_client.post(
        BASE, json=sample_testimonial(video_url="https://example.com/video.mp4")
    )
    assert response.status_code == 422
    assert "Accepted links: YouTube, Vimeo, Instagram" in response.text
    for ok in ["https://youtu.be/abc", "https://www.youtube.com/watch?v=1", "https://vimeo.com/1"]:
        assert editor_client.post(BASE, json=sample_testimonial(video_url=ok)).status_code == 201


def test_public_shape_matches_contract(
    editor_client: Any, client: Any, media_store: FakeMediaStore
) -> None:
    media = upload(editor_client, media_store).json()
    body = sample_testimonial(photo_id=media["id"], video_url="https://youtu.be/x")
    item = create(editor_client, SLUG, body)
    publish(editor_client, SLUG, item["id"])
    public = client.get("/api/v1/public/testimonials").json()[0]
    contract = schema("PublicTestimonial")
    assert set(contract["required"]) <= set(public)
    assert set(public) <= set(contract["properties"])
    assert set(schema("PublicImage")["required"]) == set(public["photo"])
    assert public["country"] in contract["properties"]["country"]["enum"]
