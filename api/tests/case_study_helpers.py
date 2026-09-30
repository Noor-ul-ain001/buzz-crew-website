from itertools import count
from typing import Any

from tests.conftest import FakeMediaStore
from tests.content_helpers import upload

BASE = "/api/v1/admin/content/case-studies"
PUBLIC = "/api/v1/public/case-studies"
_names = count(1)


def image(
    client: Any, store: FakeMediaStore, alt: str | None = "Launch week reel on a phone"
) -> str:
    response = upload(client, store, alt=alt, name=f"cs{next(_names)}")
    assert response.status_code == 201, response.text
    return response.json()["id"]


def result(value: str = "+240%", headline: bool = False, **extra: Any) -> dict[str, Any]:
    return {
        "value": value,
        "label": "Instagram reach",
        "period": "in 3 months",
        "is_headline": headline,
        **extra,
    }


def body(client: Any, store: FakeMediaStore, **overrides: Any) -> dict[str, Any]:
    data: dict[str, Any] = {
        "client_name": "Sample Café",
        "title": "Tripling weekend footfall",
        "summary": "Reels and local SEO that filled a new café in its first month.",
        "industry": "food_beverages",
        "country": "pakistan",
        "services": ["social_media", "seo"],
        "challenge_md": "A new café with **no** audience.",
        "strategy_md": "Reels, local SEO and a launch offer.",
        "execution_md": "- 12 reels\n- Google Business Profile",
        "cover_id": image(client, store),
        "results": [result(headline=True)],
    }
    data.update(overrides)
    return data


def create(client: Any, data: dict[str, Any]) -> dict[str, Any]:
    response = client.post(BASE, json=data)
    assert response.status_code == 201, response.text
    return response.json()


def publish(client: Any, item_id: str) -> Any:
    return client.post(f"{BASE}/{item_id}/publish")


def published(client: Any, store: FakeMediaStore, **overrides: Any) -> dict[str, Any]:
    item = create(client, body(client, store, **overrides))
    response = publish(client, item["id"])
    assert response.status_code == 200, response.text
    return response.json()
