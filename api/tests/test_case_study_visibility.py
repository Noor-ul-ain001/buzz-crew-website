from pathlib import Path
from typing import Any

import yaml  # pyright: ignore[reportMissingModuleSource]

from tests.case_study_helpers import BASE, PUBLIC, body, create, published
from tests.conftest import FakeMediaStore
from tests.content_helpers import create as create_content
from tests.content_helpers import publish as publish_content
from tests.content_helpers import sample_testimonial

CONTRACT = (
    Path(__file__).resolve().parents[2]
    / "specs"
    / "005-case-studies"
    / "contracts"
    / "case-studies.openapi.yaml"
)


def schemas() -> dict[str, Any]:
    return yaml.safe_load(CONTRACT.read_text(encoding="utf-8"))["components"]["schemas"]


def test_drafts_deleted_and_unknown_look_the_same(
    editor_client: Any, client: Any, media_store: FakeMediaStore
) -> None:
    draft = create(editor_client, body(editor_client, media_store, slug="draft-one"))
    gone = published(editor_client, media_store, slug="gone-one")
    editor_client.delete(f"{BASE}/{gone['id']}")
    responses = [client.get(f"{PUBLIC}/{slug}") for slug in ("draft-one", "gone-one", "never-was")]
    assert {r.status_code for r in responses} == {404}
    assert len({r.text for r in responses}) == 1
    assert draft["status"] == "draft"


def test_detail_matches_contract(
    editor_client: Any, client: Any, media_store: FakeMediaStore
) -> None:
    published(editor_client, media_store, slug="sample-cafe")
    detail = client.get(f"{PUBLIC}/sample-cafe").json()
    contract = schemas()
    card_required = set(contract["CaseStudyCard"]["required"])
    detail_required = set(contract["CaseStudyDetail"]["allOf"][1]["required"])
    assert card_required | detail_required <= set(detail)
    assert detail["headline_metrics"][0]["value"] == "+240%"
    assert detail["seo_title"] == "Tripling weekend footfall"  # falls back to the title
    assert set(contract["Image"]["required"]) == set(detail["cover"])


def test_testimonial_only_when_published(
    editor_client: Any, client: Any, media_store: FakeMediaStore
) -> None:
    quote = create_content(editor_client, "testimonials", sample_testimonial())
    published(editor_client, media_store, slug="with-quote", testimonial_id=quote["id"])
    assert client.get(f"{PUBLIC}/with-quote").json()["testimonial"] is None
    publish_content(editor_client, "testimonials", quote["id"])
    shown = client.get(f"{PUBLIC}/with-quote").json()["testimonial"]
    assert shown["name"] == "Ayesha"


def test_slugs_endpoint(editor_client: Any, client: Any, media_store: FakeMediaStore) -> None:
    published(editor_client, media_store, slug="first")
    create(editor_client, body(editor_client, media_store, slug="not-yet"))
    slugs = client.get(f"{PUBLIC}/slugs").json()
    assert [s["slug"] for s in slugs] == ["first"]
    assert slugs[0]["updated_at"]
