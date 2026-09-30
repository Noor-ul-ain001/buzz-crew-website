from typing import Any

from sqlalchemy import text


def test_editor_cannot_list_leads_and_refusal_is_recorded(editor_client: Any, db: Any) -> None:
    response = editor_client.get("/api/v1/leads")
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "forbidden"
    assert "Ayesha" not in response.text
    events = db.execute(text("SELECT type, detail FROM security_events WHERE type='access_denied'"))
    row = events.one()
    assert row.detail["path"] == "/api/v1/leads"


def test_editor_cannot_manage_users(editor_client: Any) -> None:
    assert editor_client.get("/api/v1/users").status_code == 403
    invite = {"email": "new@example.com", "name": "New", "role": "editor"}
    assert editor_client.post("/api/v1/invitations", json=invite).status_code == 403


def test_admin_can_list_leads(admin_client: Any) -> None:
    response = admin_client.get("/api/v1/leads")
    assert response.status_code == 200
    assert response.json() == {"items": []}
