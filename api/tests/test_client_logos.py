from typing import Any

from sqlalchemy import text

from tests.conftest import FakeMediaStore
from tests.content_helpers import create, publish, upload

SLUG = "client-logos"
BASE = f"/api/v1/admin/content/{SLUG}"


def logo(
    client: Any, store: FakeMediaStore, name: str, alt: str | None = "Mercantile wordmark"
) -> Any:
    return upload(client, store, usage="logo", alt=alt, filename=f"{name}.png", name=name).json()


def test_logo_and_alt_text_required_to_publish(
    editor_client: Any, media_store: FakeMediaStore
) -> None:
    item = create(editor_client, SLUG, {"name": "Mercantile"})
    fields = publish(editor_client, SLUG, item["id"]).json()["detail"]["fields"]
    assert fields == {"logo": "Add an image."}
    media = logo(editor_client, media_store, "m1", alt=None)
    editor_client.patch(f"{BASE}/{item['id']}", json={"logo_id": media["id"], "version": 1})
    refused = publish(editor_client, SLUG, item["id"])
    assert "logo.alt_text" in refused.json()["detail"]["fields"]


def test_website_url_must_be_http(editor_client: Any) -> None:
    bad = editor_client.post(BASE, json={"name": "A", "website_url": "javascript:alert(1)"})
    assert bad.status_code == 422
    good = editor_client.post(BASE, json={"name": "A", "website_url": "https://a.com"})
    assert good.status_code == 201


def test_reorder_and_public_shape(
    editor_client: Any, client: Any, media_store: FakeMediaStore
) -> None:
    ids: list[str] = []
    for name in ("First", "Second"):
        media = logo(editor_client, media_store, name)
        item = create(editor_client, SLUG, {"name": name, "logo_id": media["id"]})
        publish(editor_client, SLUG, item["id"])
        ids.append(item["id"])
    editor_client.put(f"{BASE}/order", json={"ids": ids[::-1]})
    public = client.get("/api/v1/public/client-logos").json()
    assert [p["name"] for p in public] == ["Second", "First"]
    assert set(public[0]) == {"id", "name", "logo", "website_url"}
    assert public[0]["logo"]["alt"] == "Mercantile wordmark"


def test_delete_purges_the_image(editor_client: Any, media_store: FakeMediaStore, db: Any) -> None:
    media = logo(editor_client, media_store, "gone")
    item = create(editor_client, SLUG, {"name": "Gone", "logo_id": media["id"]})
    assert editor_client.delete(f"{BASE}/{item['id']}").status_code == 204
    assert "buzzcrew/logo/gone" in media_store.deleted
    assert db.execute(text("SELECT count(*) FROM media")).scalar_one() == 0
