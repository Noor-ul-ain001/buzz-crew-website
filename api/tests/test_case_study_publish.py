from typing import Any

from tests.case_study_helpers import BASE, body, create, image, publish, result
from tests.conftest import FakeMediaStore


def fields_of(response: Any) -> dict[str, str]:
    assert response.status_code == 422, response.text
    return response.json()["detail"]["fields"]


def test_no_results_gives_the_exact_message(
    editor_client: Any, media_store: FakeMediaStore
) -> None:
    item = create(editor_client, body(editor_client, media_store, results=[]))
    assert fields_of(publish(editor_client, item["id"]))["results"] == (
        "Add at least one result before publishing"
    )


def test_seven_results_refused(editor_client: Any, media_store: FakeMediaStore) -> None:
    response = editor_client.post(
        BASE, json=body(editor_client, media_store, results=[result()] * 7)
    )
    assert response.status_code == 422


def test_four_headlines_refused(editor_client: Any, media_store: FakeMediaStore) -> None:
    item = create(
        editor_client, body(editor_client, media_store, results=[result(headline=True)] * 4)
    )
    assert "results.headline" in fields_of(publish(editor_client, item["id"]))


def test_reel_needs_a_description(editor_client: Any, media_store: FakeMediaStore) -> None:
    reel = {
        "kind": "reel",
        "media_id": image(editor_client, media_store),
        "video_url": "https://youtu.be/x",
    }
    item = create(editor_client, body(editor_client, media_store, media=[reel]))
    assert "media[].description" in fields_of(publish(editor_client, item["id"]))


def test_reel_needs_an_allowed_link(editor_client: Any, media_store: FakeMediaStore) -> None:
    reel = {
        "kind": "reel",
        "media_id": image(editor_client, media_store),
        "video_url": "https://evil.example/v",
    }
    response = editor_client.post(BASE, json=body(editor_client, media_store, media=[reel]))
    assert response.status_code == 422


def test_before_without_after_refused(editor_client: Any, media_store: FakeMediaStore) -> None:
    data = body(editor_client, media_store, before_image_id=image(editor_client, media_store))
    item = create(editor_client, data)
    assert "before_after" in fields_of(publish(editor_client, item["id"]))


def test_missing_alt_text_refused(editor_client: Any, media_store: FakeMediaStore) -> None:
    gallery = [{"kind": "image", "media_id": image(editor_client, media_store, alt=None)}]
    item = create(
        editor_client,
        body(
            editor_client,
            media_store,
            cover_id=image(editor_client, media_store, alt=None),
            media=gallery,
        ),
    )
    fields = fields_of(publish(editor_client, item["id"]))
    assert "cover.alt_text" in fields
    assert "media[].alt_text" in fields


def test_duplicate_slug_is_409(editor_client: Any, media_store: FakeMediaStore) -> None:
    create(editor_client, body(editor_client, media_store, slug="sample-cafe"))
    response = editor_client.post(BASE, json=body(editor_client, media_store, slug="sample-cafe"))
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "slug_taken"


def test_complete_case_study_publishes(editor_client: Any, media_store: FakeMediaStore) -> None:
    reel = {
        "kind": "reel",
        "media_id": image(editor_client, media_store),
        "video_url": "https://www.instagram.com/reel/abc/",
        "description": "Opening-day walkthrough",
    }
    data = body(
        editor_client,
        media_store,
        media=[{"kind": "image", "media_id": image(editor_client, media_store)}, reel],
        before_image_id=image(editor_client, media_store),
        after_image_id=image(editor_client, media_store),
    )
    item = create(editor_client, data)
    assert len(item["results"]) == 1
    assert [m["kind"] for m in item["media"]] == ["image", "reel"]
    assert publish(editor_client, item["id"]).status_code == 200
