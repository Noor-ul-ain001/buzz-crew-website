from typing import Any

from app.seed_case_studies import PROJECTS, seed


def test_seed_publishes_the_real_projects_once(client: Any, db: Any) -> None:
    assert seed() == f"Removed 0 sample case studies; added {len(PROJECTS)} projects."
    assert seed() == "Removed 0 sample case studies; added 0 projects."

    page = client.get("/api/v1/public/case-studies").json()
    assert page["total"] == len(PROJECTS)
    assert {item["slug"] for item in page["items"]} == {project.slug for project in PROJECTS}
    industries = {facet["value"] for facet in page["facets"]["industries"] if facet["count"]}
    assert industries == {"media_news", "retail"}


def test_samples_load_as_drafts_once(client: Any) -> None:
    from app.seed_samples import seed as seed_samples

    assert seed_samples() == "Added 16 draft FAQs and 9 draft posts."
    assert seed_samples() == "Added 0 draft FAQs and 0 draft posts."
    assert client.get("/api/v1/public/faqs").json() == []
    assert client.get("/api/v1/public/posts").json() == []
