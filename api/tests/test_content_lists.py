from typing import Any

from tests.conftest import FakeMediaStore
from tests.content_helpers import create, publish, sample_testimonial, upload

BASE = "/api/v1/admin/content/testimonials"


def test_list_columns_and_status_filter(editor_client: Any, media_store: FakeMediaStore) -> None:
    media = upload(editor_client, media_store).json()
    live = create(
        editor_client, "testimonials", sample_testimonial(name="Live", photo_id=media["id"])
    )
    publish(editor_client, "testimonials", live["id"])
    create(editor_client, "testimonials", {"name": "Draft"})
    gone = create(editor_client, "testimonials", {"name": "Gone"})
    editor_client.delete(f"{BASE}/{gone['id']}")

    items = editor_client.get(BASE).json()
    assert [i["name"] for i in items] == ["Live", "Draft"]
    first = items[0]
    assert first["thumbnail_url"] == media["url"]
    assert first["updated_by_name"] == "Editor Person"
    assert first["status"] == "published"
    assert first["updated_at"]

    drafts = editor_client.get(BASE, params={"status": "draft"}).json()
    assert [i["name"] for i in drafts] == ["Draft"]
