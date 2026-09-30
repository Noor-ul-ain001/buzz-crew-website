"""Case studies (005): schemas, publish rules, slugs, nested results and media, public shapes.

Built on the 004 publishing pattern through the ContentType hooks.
"""

import uuid
from datetime import datetime
from typing import Annotated, Any

from fastapi import HTTPException, status
from pydantic import BaseModel, Field, StringConstraints, field_validator, model_validator
from slugify import slugify
from sqlalchemy import delete, func
from sqlmodel import Session, col, select
from sqlmodel.sql.expression import SelectOfScalar

from app.models.case_study import (
    MARKDOWN_LIMIT,
    MAX_HEADLINES,
    MAX_IMAGES,
    MAX_REELS,
    MAX_RESULTS,
    CaseStudy,
    CaseStudyMedia,
    CaseStudyMediaKind,
    CaseStudyResult,
    CaseStudySlugHistory,
    Industry,
)
from app.models.content import Testimonial
from app.models.lead import Country, Service
from app.models.media import Media
from app.models.publishable import PublishStatus
from app.services.content_types import (
    AdminMeta,
    MediaOut,
    PublicImage,
    clean_video_url,
    image_rule,
    media_out,
    public_image,
    required,
)
from app.services.media_service import alt_text_problem
from app.services.publishing import ContentType, MediaMap, load_media, media_for

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
NO_RESULTS = "Add at least one result before publishing"


Slug = Annotated[str, StringConstraints(strip_whitespace=True, max_length=80, pattern=SLUG_PATTERN)]
Markdown = Annotated[str, StringConstraints(max_length=MARKDOWN_LIMIT)]
Text30 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=30)]
Text40 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=40)]
Text60 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=60)]
Text100 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]
Text120 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)]
Text160 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=160)]
Text200 = Annotated[str, StringConstraints(strip_whitespace=True, max_length=200)]
Required30 = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=30)]
Required40 = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]
Required80 = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]


# --- admin payloads --------------------------------------------------------------------------


class ResultIn(BaseModel):
    value: Required30
    label: Required80
    period: Required40
    starting_value: Text30 | None = None
    is_headline: bool = False


class MediaItemIn(BaseModel):
    kind: CaseStudyMediaKind
    media_id: uuid.UUID
    video_url: str | None = None
    description: Text200 | None = None

    _video = field_validator("video_url")(clean_video_url)

    @model_validator(mode="after")
    def reel_needs_a_link(self) -> "MediaItemIn":
        if self.kind is CaseStudyMediaKind.REEL and not self.video_url:
            raise ValueError("Add the reel's link (YouTube, Vimeo or Instagram).")
        return self


class CaseStudyFields(BaseModel):
    slug: Slug | None = None
    client_name: Text100 = ""
    title: Text120 = ""
    summary: Text200 = ""
    industry: Industry | None = None
    country: Country | None = None
    services: list[Service] = Field(default_factory=lambda: list[Service]())
    challenge_md: Markdown = ""
    strategy_md: Markdown = ""
    execution_md: Markdown = ""
    project_period: Text40 | None = None
    cover_id: uuid.UUID | None = None
    before_image_id: uuid.UUID | None = None
    after_image_id: uuid.UUID | None = None
    before_label: Text30 = "Before"
    after_label: Text30 = "After"
    testimonial_id: uuid.UUID | None = None
    seo_title: Text60 | None = None
    seo_description: Text160 | None = None
    results: list[ResultIn] | None = Field(default=None, max_length=MAX_RESULTS)
    media: list[MediaItemIn] | None = None

    @field_validator("services")
    @classmethod
    def unique_services(cls, value: list[Service]) -> list[Service]:
        return list(dict.fromkeys(value))

    @field_validator("media")
    @classmethod
    def media_limits(cls, value: list[MediaItemIn] | None) -> list[MediaItemIn] | None:
        if value is None:
            return value
        images = sum(1 for m in value if m.kind is CaseStudyMediaKind.IMAGE)
        reels = len(value) - images
        if images > MAX_IMAGES:
            raise ValueError(f"Use at most {MAX_IMAGES} images.")
        if reels > MAX_REELS:
            raise ValueError(f"Use at most {MAX_REELS} reels.")
        return value


class CaseStudyUpdate(CaseStudyFields):
    version: int


class ResultOut(BaseModel):
    id: uuid.UUID
    value: str
    label: str
    period: str
    starting_value: str | None
    is_headline: bool


class MediaItemOut(BaseModel):
    id: uuid.UUID
    kind: CaseStudyMediaKind
    media: MediaOut
    video_url: str | None
    description: str | None


class CaseStudyAdmin(AdminMeta):
    slug: str
    client_name: str
    title: str
    summary: str
    industry: Industry | None
    country: Country | None
    services: list[Service]
    challenge_md: str
    strategy_md: str
    execution_md: str
    project_period: str | None
    cover: MediaOut | None
    before_image: MediaOut | None
    after_image: MediaOut | None
    before_label: str
    after_label: str
    testimonial_id: uuid.UUID | None
    seo_title: str | None
    seo_description: str | None
    results: list[ResultOut]
    media: list[MediaItemOut]


# --- public shapes (contracts/case-studies.openapi.yaml) --------------------------------------


class Metric(BaseModel):
    value: str
    label: str
    period: str
    starting_value: str | None
    is_headline: bool


class CaseStudyCard(BaseModel):
    slug: str
    client_name: str
    title: str
    summary: str
    industry: Industry
    country: Country
    services: list[Service]
    headline_metrics: list[Metric]
    cover: PublicImage


class PublicMedia(BaseModel):
    kind: CaseStudyMediaKind
    image: PublicImage
    video_url: str | None
    description: str | None


class BeforeAfter(BaseModel):
    before: PublicImage
    after: PublicImage
    before_label: str
    after_label: str


class PublicQuote(BaseModel):
    name: str
    role: str
    company: str
    quote: str


class CaseStudyDetail(CaseStudyCard):
    challenge_md: str
    strategy_md: str
    execution_md: str
    project_period: str | None
    results: list[Metric]
    media: list[PublicMedia]
    before_after: BeforeAfter | None
    testimonial: PublicQuote | None
    related: list[CaseStudyCard]
    seo_title: str
    seo_description: str
    published_at: datetime
    updated_at: datetime


class Redirect(BaseModel):
    redirect_to: str


class FacetCount(BaseModel):
    value: str
    count: int


class Facets(BaseModel):
    industries: list[FacetCount]
    services: list[FacetCount]


class CaseStudyPage(BaseModel):
    items: list[CaseStudyCard]
    total: int
    page: int
    facets: Facets


class SlugEntry(BaseModel):
    slug: str
    updated_at: datetime


# --- slugs -----------------------------------------------------------------------------------


def slug_taken(session: Session, slug: str, own_id: uuid.UUID | None) -> bool:
    current = session.exec(select(CaseStudy.id).where(CaseStudy.slug == slug)).first()
    if current is not None and current != own_id:
        return True
    history = session.get(CaseStudySlugHistory, slug)
    return history is not None and history.case_study_id != own_id


def suggest_slug(
    session: Session, client_name: str, title: str, own_id: uuid.UUID | None = None
) -> str:
    base = (
        slugify(f"{client_name} {title}".strip(), max_length=80, word_boundary=True) or "case-study"
    )
    slug, n = base, 2
    while slug_taken(session, slug, own_id):
        suffix = f"-{n}"
        slug = f"{base[: 80 - len(suffix)].rstrip('-')}{suffix}"
        n += 1
    return slug


def _slug_conflict() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={
            "code": "slug_taken",
            "message": "Another case study already uses this address. Choose a different one.",
            "fields": {"slug": "This address is already in use."},
        },
    )


def before_save(session: Session, item: CaseStudy | None, values: dict[str, Any]) -> list[str]:
    testimonial_id = values.get("testimonial_id")
    if testimonial_id is not None and session.get(Testimonial, testimonial_id) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": "invalid_testimonial", "message": "That testimonial doesn't exist."},
        )
    if item is None:  # create: always give the case study an address
        slug = values.get("slug")
        if not slug:
            values["slug"] = suggest_slug(
                session, values.get("client_name", ""), values.get("title", "")
            )
        elif slug_taken(session, slug, None):
            raise _slug_conflict()
        return []

    if "slug" not in values:
        return []
    new_slug = values["slug"]
    if not new_slug or new_slug == item.slug:
        values.pop("slug")
        return []
    if slug_taken(session, new_slug, item.id):
        raise _slug_conflict()
    # Reusing one of its own old slugs: that address is current again.
    own_history = session.get(CaseStudySlugHistory, new_slug)
    if own_history is not None:
        session.delete(own_history)
    if item.status is PublishStatus.PUBLISHED:
        # Links to the old address keep working with a permanent redirect.
        session.add(CaseStudySlugHistory(old_slug=item.slug, case_study_id=item.id))
    return [f"case-study:{item.slug}"]


# --- nested rows -----------------------------------------------------------------------------


def results_of(session: Session, case_study_id: uuid.UUID) -> list[CaseStudyResult]:
    return list(
        session.exec(
            select(CaseStudyResult)
            .where(CaseStudyResult.case_study_id == case_study_id)
            .order_by(col(CaseStudyResult.sort_order))
        ).all()
    )


def media_of(session: Session, case_study_id: uuid.UUID) -> list[CaseStudyMedia]:
    return list(
        session.exec(
            select(CaseStudyMedia)
            .where(CaseStudyMedia.case_study_id == case_study_id)
            .order_by(col(CaseStudyMedia.sort_order))
        ).all()
    )


def apply_nested(session: Session, item: CaseStudy, nested: dict[str, Any]) -> None:
    if nested.get("results") is not None:
        session.execute(  # pyright: ignore[reportDeprecated]
            delete(CaseStudyResult).where(col(CaseStudyResult.case_study_id) == item.id)
        )
        for order, result in enumerate(nested["results"]):
            session.add(CaseStudyResult(case_study_id=item.id, sort_order=order, **result))
    if nested.get("media") is not None:
        wanted = [m["media_id"] for m in nested["media"]]
        found = set(session.exec(select(Media.id).where(col(Media.id).in_(wanted))).all())
        if missing := [str(m) for m in wanted if m not in found]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail={
                    "code": "invalid_media",
                    "message": "An image couldn't be found. Please upload it again.",
                    "missing": missing,
                },
            )
        session.execute(  # pyright: ignore[reportDeprecated]
            delete(CaseStudyMedia).where(col(CaseStudyMedia.case_study_id) == item.id)
        )
        for order, entry in enumerate(nested["media"]):
            session.add(CaseStudyMedia(case_study_id=item.id, sort_order=order, **entry))


def on_delete(session: Session, item: CaseStudy) -> list[uuid.UUID]:
    rows = media_of(session, item.id)
    session.execute(  # pyright: ignore[reportDeprecated]
        delete(CaseStudyMedia).where(col(CaseStudyMedia.case_study_id) == item.id)
    )
    session.execute(  # pyright: ignore[reportDeprecated]
        delete(CaseStudyResult).where(col(CaseStudyResult.case_study_id) == item.id)
    )
    return [row.media_id for row in rows]


def admin_extra(session: Session, item: CaseStudy) -> dict[str, Any]:
    rows = media_of(session, item.id)
    images = (
        {
            m.id: m
            for m in session.exec(
                select(Media).where(col(Media.id).in_([r.media_id for r in rows]))
            ).all()
        }
        if rows
        else {}
    )
    return {
        "results": [
            ResultOut.model_validate(r, from_attributes=True) for r in results_of(session, item.id)
        ],
        "media": [
            MediaItemOut(
                id=row.id,
                kind=row.kind,
                media=media_out(images[row.media_id]),  # pyright: ignore[reportArgumentType]
                video_url=row.video_url,
                description=row.description,
            )
            for row in rows
            if row.media_id in images
        ],
    }


# --- publish rules ---------------------------------------------------------------------------


def extra_rules(session: Session, item: CaseStudy) -> dict[str, str]:
    errors: dict[str, str] = {}
    media = load_media(session, CASE_STUDIES, [item])
    required(errors, "client_name", item.client_name, "Enter the client's name.")
    required(errors, "title", item.title, "Enter a title.")
    required(errors, "summary", item.summary, "Write a one-line summary.")
    required(errors, "industry", item.industry, "Choose an industry.")
    required(errors, "country", item.country, "Choose a country.")
    if not item.services:
        errors["services"] = "Choose at least one service."
    required(errors, "challenge_md", item.challenge_md, "Describe the challenge.")
    required(errors, "strategy_md", item.strategy_md, "Describe the strategy.")
    required(errors, "execution_md", item.execution_md, "Describe how it was done.")
    image_rule(errors, "cover", media_for(item, "cover_id", media), needed=True)

    results = results_of(session, item.id)
    if not results:
        errors["results"] = NO_RESULTS
    elif len(results) > MAX_RESULTS:
        errors["results"] = f"Use at most {MAX_RESULTS} results."
    if sum(1 for r in results if r.is_headline) > MAX_HEADLINES:
        errors["results.headline"] = f"Mark at most {MAX_HEADLINES} results as headline."

    before = media_for(item, "before_image_id", media)
    after = media_for(item, "after_image_id", media)
    if (before is None) != (after is None):
        errors["before_after"] = "Add both a before and an after image, or neither."
    else:
        image_rule(errors, "before_after", before, needed=False)
        image_rule(errors, "before_after", after, needed=False)

    rows = media_of(session, item.id)
    images = {m.id: m for m in load_gallery(session, rows)}
    for row in rows:
        if problem := alt_text_problem(images.get(row.media_id)):
            errors["media[].alt_text"] = problem
        if row.kind is CaseStudyMediaKind.REEL and not (row.description or "").strip():
            errors["media[].description"] = "Describe what happens in each reel."
    return errors


def load_gallery(session: Session, rows: list[CaseStudyMedia]) -> list[Media]:
    if not rows:
        return []
    return list(
        session.exec(select(Media).where(col(Media.id).in_([r.media_id for r in rows]))).all()
    )


# --- public ----------------------------------------------------------------------------------


def _metric(result: CaseStudyResult) -> Metric:
    return Metric(
        value=result.value,
        label=result.label,
        period=result.period,
        starting_value=result.starting_value,
        is_headline=result.is_headline,
    )


def headline_metrics(results: list[CaseStudyResult]) -> list[Metric]:
    """Flagged headline results; if none is flagged, the first one stands in."""
    flagged = [r for r in results if r.is_headline][:MAX_HEADLINES]
    return [_metric(r) for r in (flagged or results[:1])]


def to_card(
    item: CaseStudy, media: MediaMap, results: list[CaseStudyResult]
) -> CaseStudyCard | None:
    cover = public_image(media_for(item, "cover_id", media))
    if cover is None or item.industry is None or item.country is None:
        return None  # can't happen for items that passed the publish rules
    return CaseStudyCard(
        slug=item.slug,
        client_name=item.client_name,
        title=item.title,
        summary=item.summary,
        industry=item.industry,
        country=item.country,
        services=list(item.services),
        headline_metrics=headline_metrics(results),
        cover=cover,
    )


def published_query() -> SelectOfScalar[CaseStudy]:
    return select(CaseStudy).where(
        col(CaseStudy.status) == PublishStatus.PUBLISHED, col(CaseStudy.deleted_at).is_(None)
    )


def cards_for(session: Session, items: list[CaseStudy]) -> list[CaseStudyCard]:
    media = load_media(session, CASE_STUDIES, items)
    by_item: dict[uuid.UUID, list[CaseStudyResult]] = {item.id: [] for item in items}
    if items:
        for result in session.exec(
            select(CaseStudyResult)
            .where(col(CaseStudyResult.case_study_id).in_(list(by_item)))
            .order_by(col(CaseStudyResult.sort_order))
        ).all():
            by_item[result.case_study_id].append(result)
    return [card for item in items if (card := to_card(item, media, by_item[item.id])) is not None]


def list_page(
    session: Session,
    *,
    industry: Industry | None,
    service: Service | None,
    page: int,
    page_size: int,
) -> CaseStudyPage:
    query = published_query()
    if industry is not None:
        query = query.where(col(CaseStudy.industry) == industry)
    if service is not None:
        query = query.where(col(CaseStudy.services).contains([service]))
    total = int(session.exec(select(func.count()).select_from(query.subquery())).one())
    items = list(
        session.exec(
            query.order_by(col(CaseStudy.sort_order), col(CaseStudy.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )
    return CaseStudyPage(
        items=cards_for(session, items), total=total, page=page, facets=facets(session)
    )


def facets(session: Session) -> Facets:
    """Counts over every published case study (drafts and deleted items never count)."""
    published = published_query().subquery()
    industries = session.exec(
        select(published.c.industry, func.count())
        .where(published.c.industry.is_not(None))
        .group_by(published.c.industry)
    ).all()
    service = func.unnest(published.c.services).label("service")
    services = session.exec(
        select(service, func.count()).select_from(published).group_by(service)
    ).all()
    order = {value: index for index, value in enumerate(Industry)}
    service_order = {value: index for index, value in enumerate(Service)}
    return Facets(
        industries=sorted(
            (FacetCount(value=str(value), count=int(count)) for value, count in industries),
            key=lambda f: order[Industry(f.value)],
        ),
        services=sorted(
            (FacetCount(value=str(value), count=int(count)) for value, count in services),
            key=lambda f: service_order[Service(f.value)],
        ),
    )


def related(session: Session, item: CaseStudy, limit: int = 3) -> list[CaseStudyCard]:
    """3 points for the same industry plus 1 per shared service, then editor order."""
    others = list(
        session.exec(
            published_query()
            .where(col(CaseStudy.id) != item.id)
            .order_by(col(CaseStudy.sort_order), col(CaseStudy.created_at))
        ).all()
    )
    mine = set(item.services)

    def score(other: CaseStudy) -> int:
        return (3 if other.industry == item.industry else 0) + len(mine & set(other.services))

    ranked = sorted((o for o in others if score(o) > 0), key=lambda o: -score(o))  # stable
    return cards_for(session, ranked[:limit])


def detail(session: Session, item: CaseStudy) -> CaseStudyDetail | None:
    media = load_media(session, CASE_STUDIES, [item])
    results = results_of(session, item.id)
    card = to_card(item, media, results)
    if card is None or item.published_at is None:
        return None
    rows = media_of(session, item.id)
    gallery = {m.id: m for m in load_gallery(session, rows)}
    before = public_image(media_for(item, "before_image_id", media))
    after = public_image(media_for(item, "after_image_id", media))
    quote = session.get(Testimonial, item.testimonial_id) if item.testimonial_id else None
    show_quote = (
        quote is not None and quote.status is PublishStatus.PUBLISHED and quote.deleted_at is None
    )
    return CaseStudyDetail(
        **card.model_dump(),
        challenge_md=item.challenge_md,
        strategy_md=item.strategy_md,
        execution_md=item.execution_md,
        project_period=item.project_period,
        results=[_metric(r) for r in results],
        media=[
            PublicMedia(
                kind=row.kind,
                image=image,
                video_url=row.video_url,
                description=row.description,
            )
            for row in rows
            if (image := public_image(gallery.get(row.media_id))) is not None
        ],
        before_after=BeforeAfter(
            before=before, after=after, before_label=item.before_label, after_label=item.after_label
        )
        if before and after
        else None,
        testimonial=PublicQuote(
            name=quote.name, role=quote.role, company=quote.company, quote=quote.quote
        )
        if show_quote and quote is not None
        else None,
        related=related(session, item),
        seo_title=item.seo_title or item.title,
        seo_description=item.seo_description or item.summary,
        published_at=item.published_at,
        updated_at=item.updated_at,
    )


def find_public(session: Session, slug: str) -> CaseStudyDetail | Redirect:
    item = session.exec(published_query().where(col(CaseStudy.slug) == slug)).first()
    if item is not None and (out := detail(session, item)) is not None:
        return out
    history = session.get(CaseStudySlugHistory, slug)
    if history is not None:
        target = session.exec(
            published_query().where(col(CaseStudy.id) == history.case_study_id)
        ).first()
        if target is not None:
            return Redirect(redirect_to=target.slug)
    # Drafts, deleted items and unknown slugs look the same from outside.
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "not_found", "message": "No such case study."},
    )


CASE_STUDIES = ContentType(
    slug="case-studies",
    activity_name="case_study",
    label="case study",
    model=CaseStudy,
    create_schema=CaseStudyFields,
    update_schema=CaseStudyUpdate,
    admin_schema=CaseStudyAdmin,
    public_schema=CaseStudyCard,
    media_fields=("cover_id", "before_image_id", "after_image_id"),
    rules=lambda item, media: {},  # pyright: ignore[reportUnknownLambdaType]
    to_public=lambda item, media: None,  # pyright: ignore[reportUnknownLambdaType]
    tags=("case-studies",),
    nested_fields=("results", "media"),
    before_save=before_save,
    apply_nested=apply_nested,
    extra_rules=extra_rules,
    admin_extra=admin_extra,
    item_tags=lambda item: [f"case-study:{item.slug}"],
    on_delete=on_delete,
    public_list=False,
)
