from typing import Any

from tests.case_study_helpers import BASE, PUBLIC, body, create, published
from tests.conftest import FakeMediaStore, FakeRevalidation


def test_slug_is_suggested_from_client_and_title(
    editor_client: Any, media_store: FakeMediaStore
) -> None:
    first = create(editor_client, body(editor_client, media_store))
    second = create(editor_client, body(editor_client, media_store))
    assert first["slug"] == "sample-cafe-tripling-weekend-footfall"
    assert second["slug"] == "sample-cafe-tripling-weekend-footfall-2"


def test_old_slug_redirects_after_a_change(
    editor_client: Any, client: Any, media_store: FakeMediaStore, revalidations: FakeRevalidation
) -> None:
    item = published(editor_client, media_store, slug="old-address")
    response = editor_client.patch(
        f"{BASE}/{item['id']}", json={"slug": "new-address", "version": item["version"]}
    )
    assert response.status_code == 200, response.text
    assert client.get(f"{PUBLIC}/old-address").json() == {"redirect_to": "new-address"}
    assert client.get(f"{PUBLIC}/new-address").status_code == 200
    assert "case-study:old-address" in revalidations.tags[-1]

    # Another case study can't take the old address while it redirects.
    clash = editor_client.post(BASE, json=body(editor_client, media_store, slug="old-address"))
    assert clash.status_code == 409


def test_unpublish_revalidates_list_and_page(
    editor_client: Any, client: Any, media_store: FakeMediaStore, revalidations: FakeRevalidation
) -> None:
    item = published(editor_client, media_store, slug="going-away")
    editor_client.post(f"{BASE}/{item['id']}/unpublish")
    assert revalidations.tags[-1] == ["case-studies", "case-study:going-away"]
    assert client.get(f"{PUBLIC}/going-away").status_code == 404
