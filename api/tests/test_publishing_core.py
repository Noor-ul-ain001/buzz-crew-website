from concurrent.futures import ThreadPoolExecutor
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.main import app
from tests.conftest import FakeRevalidation, login
from tests.content_helpers import create, publish, sample_testimonial

SLUG = "testimonials"
BASE = f"/api/v1/admin/content/{SLUG}"


def test_draft_save_skips_checks(editor_client: Any) -> None:
    item = create(editor_client, SLUG, {"name": "Just a name"})
    assert item["status"] == "draft"
    assert item["version"] == 1


def test_publish_enforces_checks(editor_client: Any, revalidations: FakeRevalidation) -> None:
    item = create(editor_client, SLUG, {"name": "Just a name"})
    response = publish(editor_client, SLUG, item["id"])
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["code"] == "publish_requirements_not_met"
    assert {"role", "company", "country", "quote"} <= set(detail["fields"])
    assert revalidations.tags == []


def test_published_edit_enforces_checks(editor_client: Any) -> None:
    item = create(editor_client, SLUG, sample_testimonial())
    published = publish(editor_client, SLUG, item["id"]).json()
    response = editor_client.patch(
        f"{BASE}/{item['id']}", json={"quote": "too short", "version": published["version"]}
    )
    assert response.status_code == 422
    current = editor_client.get(f"{BASE}/{item['id']}").json()
    assert current["quote"] == sample_testimonial()["quote"]  # nothing saved


def test_public_shows_only_published_and_not_deleted(
    editor_client: Any, client: Any, revalidations: FakeRevalidation
) -> None:
    create(editor_client, SLUG, sample_testimonial(name="Draft Person"))
    live = create(editor_client, SLUG, sample_testimonial(name="Live Person"))
    gone = create(editor_client, SLUG, sample_testimonial(name="Gone Person"))
    publish(editor_client, SLUG, live["id"])
    publish(editor_client, SLUG, gone["id"])
    assert editor_client.delete(f"{BASE}/{gone['id']}").status_code == 204

    names = [t["name"] for t in client.get("/api/v1/public/testimonials").json()]
    assert names == ["Live Person"]
    assert ["testimonials"] in revalidations.tags
    admin_names = [t["name"] for t in editor_client.get(BASE).json()]
    assert "Gone Person" not in admin_names


def test_version_conflict(editor_client: Any) -> None:
    item = create(editor_client, SLUG, {"name": "First"})
    ok = editor_client.patch(f"{BASE}/{item['id']}", json={"name": "Second", "version": 1})
    assert ok.status_code == 200
    assert ok.json()["version"] == 2
    stale = editor_client.patch(f"{BASE}/{item['id']}", json={"name": "Third", "version": 1})
    assert stale.status_code == 409
    detail = stale.json()["detail"]
    assert detail["code"] == "version_conflict"
    assert detail["current"]["name"] == "Second"
    assert "Editor Person" in detail["message"]


def test_reorder_keeps_unlisted_items_at_the_end(editor_client: Any, client: Any) -> None:
    a = create(editor_client, SLUG, sample_testimonial(name="A"))
    b = create(editor_client, SLUG, sample_testimonial(name="B"))
    c = create(editor_client, SLUG, sample_testimonial(name="C"))
    # Someone else adds D after this editor loaded the list of A, B, C.
    d = create(editor_client, SLUG, sample_testimonial(name="D"))
    for item in (a, b, c, d):
        publish(editor_client, SLUG, item["id"])
    response = editor_client.put(f"{BASE}/order", json={"ids": [c["id"], a["id"], b["id"]]})
    assert response.status_code == 204
    public = [t["name"] for t in client.get("/api/v1/public/testimonials").json()]
    assert public == ["C", "A", "B", "D"]


def test_concurrent_reorders_leave_a_consistent_order(editor_client: Any, admin: Any) -> None:
    items = [create(editor_client, SLUG, sample_testimonial(name=n)) for n in "ABC"]
    ids = [i["id"] for i in items]
    with TestClient(app, headers={"Origin": "http://localhost:3000"}) as other:
        login(other)
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(
                pool.map(
                    lambda args: args[0].put(f"{BASE}/order", json={"ids": args[1]}).status_code,
                    [(editor_client, ids[::-1]), (other, ids)],
                )
            )
    assert results == [204, 204]
    orders = sorted(t["sort_order"] for t in editor_client.get(BASE).json())
    assert orders == [0, 1, 2]


def test_activity_rows_are_written(editor_client: Any, db: Any) -> None:
    item = create(editor_client, SLUG, sample_testimonial())
    publish(editor_client, SLUG, item["id"])
    editor_client.post(f"{BASE}/{item['id']}/unpublish")
    editor_client.delete(f"{BASE}/{item['id']}")
    rows = db.execute(
        text("SELECT action FROM content_activity WHERE content_id = :id ORDER BY id"),
        {"id": item["id"]},
    )
    assert [r[0] for r in rows] == ["created", "published", "unpublished", "deleted"]


def test_anonymous_cannot_use_admin_routes(client: Any) -> None:
    assert client.get(BASE).status_code == 401
    assert client.post(BASE, json={"name": "x"}).status_code == 401
