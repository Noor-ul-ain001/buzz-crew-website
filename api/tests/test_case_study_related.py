from typing import Any

from tests.case_study_helpers import PUBLIC, body, create, published
from tests.conftest import FakeMediaStore


def related(client: Any, slug: str) -> list[str]:
    return [item["slug"] for item in client.get(f"{PUBLIC}/{slug}").json()["related"]]


def test_ranking_and_exclusions(
    editor_client: Any, client: Any, media_store: FakeMediaStore
) -> None:
    published(
        editor_client,
        media_store,
        slug="me",
        industry="food_beverages",
        services=["seo", "social_media"],
    )
    published(
        editor_client, media_store, slug="one-service", industry="education", services=["seo"]
    )
    published(
        editor_client,
        media_store,
        slug="same-industry",
        industry="food_beverages",
        services=["meta_ads"],
    )
    published(
        editor_client,
        media_store,
        slug="two-services",
        industry="ecommerce",
        services=["seo", "social_media"],
    )
    published(
        editor_client,
        media_store,
        slug="unrelated",
        industry="farmhouses",
        services=["web_software"],
    )
    create(editor_client, body(editor_client, media_store, slug="draft", industry="food_beverages"))

    assert related(client, "me") == ["same-industry", "two-services", "one-service"]


def test_empty_when_nothing_matches(
    editor_client: Any, client: Any, media_store: FakeMediaStore
) -> None:
    published(
        editor_client, media_store, slug="alone", industry="farmhouses", services=["web_software"]
    )
    published(editor_client, media_store, slug="other", industry="education", services=["seo"])
    assert related(client, "alone") == []
