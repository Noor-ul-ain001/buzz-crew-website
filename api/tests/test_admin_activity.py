from typing import Any

from tests.content_helpers import create, publish
from tests.helpers import valid_lead

URL = "/api/v1/admin/activity"


def test_activity_counts_each_kind_for_today(admin_client: Any) -> None:
    lead_id = admin_client.post("/api/v1/leads", json=valid_lead()).json()["id"]
    admin_client.patch(f"/api/v1/leads/{lead_id}", json={"status": "contacted"})
    admin_client.post(f"/api/v1/leads/{lead_id}/notes", json={"body": "Called back."})
    admin_client.post("/api/v1/newsletter", json={"email": "reader@example.com"})
    faq = create(
        admin_client,
        "faqs",
        {"group": "Working with us", "question": "Where?", "answer": "Karachi, Pakistan."},
    )
    publish(admin_client, "faqs", faq["id"])

    body = admin_client.get(URL).json()
    assert len(body["days"]) == 30
    today = body["days"][-1]
    assert (today["inquiries"], today["subscribers"], today["lead_updates"]) == (1, 1, 2)
    assert today["content"] == 2  # created, then published
    assert {stage["status"]: stage["count"] for stage in body["pipeline"]}["contacted"] == 1


def test_feed_is_newest_first_and_names_what_happened(admin_client: Any) -> None:
    lead_id = admin_client.post("/api/v1/leads", json=valid_lead()).json()["id"]
    admin_client.patch(f"/api/v1/leads/{lead_id}", json={"status": "won"})
    feed = admin_client.get(URL).json()["recent"]
    assert feed[0]["kind"] == "lead_update"
    assert feed[0]["text"] == "Admin Person moved Ayesha Khan to Won"
    assert feed[1]["kind"] == "inquiry" and feed[1]["lead_id"] == lead_id


def test_deleted_leads_leave_the_feed(admin_client: Any) -> None:
    lead_id = admin_client.post("/api/v1/leads", json=valid_lead()).json()["id"]
    admin_client.delete(f"/api/v1/leads/{lead_id}")
    assert admin_client.get(URL).json()["recent"] == []


def test_activity_is_admin_only(editor_client: Any) -> None:
    assert editor_client.get(URL).status_code == 403
