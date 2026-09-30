"""Public case study pages and the /work list (005 US1, US4)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, col

from app.core.database import get_session
from app.models.case_study import CaseStudy, Industry
from app.models.lead import Service
from app.services import case_study_service as service
from app.services.case_study_service import CaseStudyDetail, CaseStudyPage, Redirect, SlugEntry

router = APIRouter(prefix="/api/v1/public/case-studies", tags=["case studies"])

DbSession = Annotated[Session, Depends(get_session)]
# 3 for "related" style strips, 12 for the /work grid.
PAGE_SIZES = (3, 12)


@router.get("", response_model=CaseStudyPage, operation_id="listPublicCaseStudies")
def list_case_studies(
    session: DbSession,
    industry: Industry | None = None,
    service_filter: Annotated[Service | None, Query(alias="service")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(json_schema_extra={"enum": [3, 12]})] = 12,
) -> CaseStudyPage:
    if page_size not in PAGE_SIZES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": "invalid_page_size", "message": "page_size must be 3 or 12."},
        )
    return service.list_page(
        session, industry=industry, service=service_filter, page=page, page_size=page_size
    )


@router.get("/slugs", response_model=list[SlugEntry], operation_id="listPublishedSlugs")
def published_slugs(session: DbSession) -> list[SlugEntry]:
    items = session.exec(service.published_query().order_by(col(CaseStudy.sort_order))).all()
    return [SlugEntry(slug=item.slug, updated_at=item.updated_at) for item in items]


@router.get(
    "/{slug}",
    response_model=CaseStudyDetail | Redirect,
    operation_id="getPublicCaseStudy",
    responses={404: {"description": "Not found, draft or deleted (indistinguishable)"}},
)
def get_case_study(slug: str, session: DbSession) -> CaseStudyDetail | Redirect:
    return service.find_public(session, slug)
