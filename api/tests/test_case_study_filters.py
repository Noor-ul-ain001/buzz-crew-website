from typing import Any

from tests.case_study_helpers import PUBLIC, body, create, published
from tests.conftest import FakeMediaStore


def seed(client: Any, store: FakeMediaStore) -> None:
    published(client, store, slug="cafe", industry="food_beverages", services=["digital_marketing"])
    published(client, store, slug="bakery", industry="food_beverages", services=["branding"])
    published(
        client,
        store,
        slug="clinic",
        industry="healthcare_dental",
        services=["branding", "copywriting"],
    )
    create(client, body(client, store, slug="draft", industry="education", services=["branding"]))


def slugs(response: Any) -> list[str]:
    return [item["slug"] for item in response.json()["items"]]


def test_filters(editor_client: Any, client: Any, media_store: FakeMediaStore) -> None:
    seed(editor_client, media_store)
    assert slugs(client.get(PUBLIC, params={"industry": "food_beverages"})) == ["cafe", "bakery"]
    assert slugs(client.get(PUBLIC, params={"service": "branding"})) == ["bakery", "clinic"]
    both = client.get(PUBLIC, params={"industry": "food_beverages", "service": "branding"})
    assert slugs(both) == ["bakery"]
    assert both.json()["total"] == 1


def test_facets_count_only_published(
    editor_client: Any, client: Any, media_store: FakeMediaStore
) -> None:
    seed(editor_client, media_store)
    facets = client.get(PUBLIC).json()["facets"]
    assert facets["industries"] == [
        {"value": "food_beverages", "count": 2},
        {"value": "healthcare_dental", "count": 1},
    ]
    assert {f["value"]: f["count"] for f in facets["services"]} == {
        "digital_marketing": 1,
        "branding": 2,
        "copywriting": 1,
    }


def test_paging(editor_client: Any, client: Any, media_store: FakeMediaStore) -> None:
    for n in range(4):
        published(editor_client, media_store, slug=f"study-{n}")
    first = client.get(PUBLIC, params={"page_size": 3}).json()
    second = client.get(PUBLIC, params={"page_size": 3, "page": 2}).json()
    assert first["total"] == 4
    assert len(first["items"]) == 3
    assert [i["slug"] for i in second["items"]] == ["study-3"]
    assert client.get(PUBLIC, params={"page_size": 5}).status_code == 422
