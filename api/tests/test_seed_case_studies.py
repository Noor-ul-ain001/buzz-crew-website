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
