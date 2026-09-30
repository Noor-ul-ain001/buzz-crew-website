from typing import Any

from tests.conftest import FakeMediaStore
from tests.content_helpers import create, publish, upload

SLUG = "team-members"
BASE = f"/api/v1/admin/content/{SLUG}"


def test_limits(editor_client: Any) -> None:
    assert editor_client.post(BASE, json={"name": "A", "bio": "b" * 301}).status_code == 422
    assert editor_client.post(BASE, json={"name": "A", "role": "r" * 101}).status_code == 422


def test_photo_and_bio_required_to_publish(editor_client: Any) -> None:
    item = create(editor_client, SLUG, {"name": "Sana", "role": "Head of Social"})
    fields = publish(editor_client, SLUG, item["id"]).json()["detail"]["fields"]
    assert {"bio", "photo"} <= set(fields)


def test_published_members_in_order(
    editor_client: Any, client: Any, media_store: FakeMediaStore
) -> None:
    ids: list[str] = []
    for index, name in enumerate(["Hamza", "Sana"]):
        media = upload(editor_client, media_store, alt=f"Portrait of {name}", name=f"p{index}")
        body = {
            "name": name,
            "role": "Team",
            "bio": "Works on client campaigns.",
            "photo_id": media.json()["id"],
        }
        item = create(editor_client, SLUG, body)
        assert publish(editor_client, SLUG, item["id"]).status_code == 200
        ids.append(item["id"])
    editor_client.put(f"{BASE}/order", json={"ids": ids[::-1]})
    public = client.get("/api/v1/public/team-members").json()
    assert [p["name"] for p in public] == ["Sana", "Hamza"]
    assert set(public[0]) == {"id", "name", "role", "bio", "photo"}
