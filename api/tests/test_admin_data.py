"""Leads workflow, FAQs, blog posts and newsletter subscribers: all stored in the database."""

from typing import Any

from sqlalchemy import text

from tests.content_helpers import create, publish
from tests.helpers import valid_lead


def new_lead(client: Any) -> str:
    response = client.post("/api/v1/leads", json=valid_lead())
    assert response.status_code == 201
    return response.json()["id"]


def test_a_new_lead_starts_its_history(admin_client: Any) -> None:
    lead_id = new_lead(admin_client)
    lead = admin_client.get(f"/api/v1/leads/{lead_id}").json()
    assert [(e["from_status"], e["to_status"]) for e in lead["events"]] == [(None, "new")]
    assert lead["notes"] == []


def test_status_change_is_recorded_with_who_made_it(admin_client: Any) -> None:
    lead_id = new_lead(admin_client)
    response = admin_client.patch(f"/api/v1/leads/{lead_id}", json={"status": "contacted"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "contacted"
    assert body["events"][-1] == {
        **body["events"][-1],
        "from_status": "new",
        "to_status": "contacted",
        "actor_name": "Admin Person",
    }
    # Setting the same status again adds nothing.
    again = admin_client.patch(f"/api/v1/leads/{lead_id}", json={"status": "contacted"}).json()
    assert len(again["events"]) == 2


def test_notes_are_kept_in_order(admin_client: Any) -> None:
    lead_id = new_lead(admin_client)
    for body in ("Called, no answer.", "Sent the proposal."):
        assert (
            admin_client.post(f"/api/v1/leads/{lead_id}/notes", json={"body": body}).status_code
            == 201
        )
    lead = admin_client.get(f"/api/v1/leads/{lead_id}").json()
    assert [note["body"] for note in lead["notes"]] == ["Called, no answer.", "Sent the proposal."]
    assert lead["notes"][0]["author_name"] == "Admin Person"
    assert (
        admin_client.post(f"/api/v1/leads/{lead_id}/notes", json={"body": " "}).status_code == 422
    )


def test_deleted_leads_leave_the_list_but_stay_stored(admin_client: Any, db: Any) -> None:
    lead_id = new_lead(admin_client)
    assert admin_client.delete(f"/api/v1/leads/{lead_id}").status_code == 204
    assert admin_client.get("/api/v1/leads").json()["items"] == []
    assert admin_client.get(f"/api/v1/leads/{lead_id}").status_code == 404
    assert db.execute(text("SELECT count(*) FROM leads")).scalar_one() == 1


def test_editors_cannot_touch_leads(editor_client: Any) -> None:
    lead_id = new_lead(editor_client)
    assert (
        editor_client.patch(f"/api/v1/leads/{lead_id}", json={"status": "won"}).status_code == 403
    )
    assert editor_client.delete(f"/api/v1/leads/{lead_id}").status_code == 403


def test_faqs_publish_and_appear_publicly(editor_client: Any) -> None:
    draft = create(
        editor_client, "faqs", {"group": "Working with us", "question": "Where are you based?"}
    )
    blocked = publish(editor_client, "faqs", draft["id"])
    assert blocked.json()["detail"]["fields"]["answer"] == "Answer must be at least 10 characters."

    item = create(
        editor_client,
        "faqs",
        {
            "group": "Working with us",
            "question": "Where are you based?",
            "answer": "Karachi, Pakistan.",
        },
    )
    assert publish(editor_client, "faqs", item["id"]).status_code == 200
    public = editor_client.get("/api/v1/public/faqs").json()
    assert [faq["question"] for faq in public] == ["Where are you based?"]


def post_body(**overrides: Any) -> dict[str, Any]:
    body: dict[str, Any] = {
        "slug": "first-post",
        "title": "Our first post",
        "excerpt": "A short summary.",
        "body_md": "Body text " * 10,
        "author_name": "The Buzz Crew",
        "category": "social-media",
        "tags": ["Instagram"],
        "reading_minutes": 3,
    }
    body.update(overrides)
    return body


def test_posts_need_a_unique_address(editor_client: Any) -> None:
    create(editor_client, "posts", post_body())
    clash = editor_client.post("/api/v1/admin/content/posts", json=post_body(title="Another"))
    assert clash.status_code == 409
    assert clash.json()["detail"]["code"] == "slug_taken"
    bad = editor_client.post("/api/v1/admin/content/posts", json=post_body(slug="Not A Slug"))
    assert bad.status_code == 422


def test_published_posts_are_public_with_their_fields(editor_client: Any) -> None:
    item = create(editor_client, "posts", post_body())
    assert editor_client.get("/api/v1/public/posts").json() == []
    assert publish(editor_client, "posts", item["id"]).status_code == 200
    [post] = editor_client.get("/api/v1/public/posts").json()
    assert (post["slug"], post["tags"], post["reading_minutes"]) == ("first-post", ["Instagram"], 3)
    assert post["published_at"] is not None


def test_newsletter_signup_is_stored_once(admin_client: Any) -> None:
    for _ in range(2):
        response = admin_client.post(
            "/api/v1/newsletter", json={"email": "Reader@Example.com", "source_page": "/blog"}
        )
        assert response.status_code == 204
    subscribers = admin_client.get("/api/v1/admin/subscribers").json()
    assert [(s["email"], s["source_page"]) for s in subscribers] == [
        ("reader@example.com", "/blog")
    ]
    assert (
        admin_client.delete(f"/api/v1/admin/subscribers/{subscribers[0]['id']}").status_code == 204
    )
    assert admin_client.get("/api/v1/admin/subscribers").json() == []


def test_subscriber_list_is_admin_only(editor_client: Any) -> None:
    assert editor_client.get("/api/v1/admin/subscribers").status_code == 403
