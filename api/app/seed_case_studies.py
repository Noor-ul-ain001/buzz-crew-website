"""The agency's Instagram projects, loaded as published case studies.

Figures are the public profile counts from the screenshots in web/public/work. Running it
again is safe: it removes the old sample case studies, then adds any project not already
in the database.
"""

from dataclasses import dataclass

from sqlalchemy import delete
from sqlmodel import Session, col, select

from app.core import clock
from app.core.database import get_engine
from app.models.case_study import (
    CaseStudy,
    CaseStudyMedia,
    CaseStudyMediaKind,
    CaseStudyResult,
    Industry,
)
from app.models.lead import Country, Service
from app.models.publishable import PublishStatus
from app.services.static_media import static_media


@dataclass(frozen=True)
class Project:
    slug: str
    client_name: str
    handle: str
    title: str
    summary: str
    industry: Industry
    challenge: str
    strategy: str
    execution: str
    # (value, label, period)
    results: list[tuple[str, str, str]]


PROJECTS: list[Project] = [
    Project(
        slug="islamabad-now",
        client_name="Islamabad Now",
        handle="islamabadnowpk",
        title="A verified city news brand with 156K followers",
        summary="Daily Islamabad news on Instagram, grown into a verified account followed by "
        "156K people.",
        industry=Industry.MEDIA_NEWS,
        challenge="Islamabad Now covers everything happening in the capital. Breaking news "
        "moves fast, so every post has to be accurate, on-brand and out quickly.",
        strategy="- One recognisable template for every story\n"
        "- Urdu headlines that read at a glance in the feed\n"
        "- A steady daily publishing rhythm, with video for the biggest stories",
        execution="Branded news cards and short videos, published through the day across "
        "politics, civic updates and local stories.",
        results=[
            ("156K", "Instagram followers", "verified account"),
            ("2,515", "posts published", "on the feed"),
        ],
    ),
    Project(
        slug="awami-web",
        client_name="AwamiWeb",
        handle="awami_web",
        title="Timely Pakistan news for 102K followers",
        summary="A national news page with more than 6,000 posts and 102K followers on Instagram.",
        industry=Industry.MEDIA_NEWS,
        challenge="AwamiWeb has published news since 2010. Its Instagram needed to keep pace "
        "with the website and stand out in a crowded news feed.",
        strategy="- A bold, consistent AwamiWeb frame on every post\n"
        "- Bilingual headlines for a wider audience\n"
        "- High-volume publishing, prioritising stories people share",
        execution="Designed news posts and reels covering sport, national affairs, "
        "technology and civic updates.",
        results=[
            ("102K", "Instagram followers", "and growing"),
            ("6,113", "posts published", "on the feed"),
        ],
    ),
    Project(
        slug="mercantile-pakistan",
        client_name="Mercantile Pakistan",
        handle="mercantile.pak",
        title="Launch campaigns for Apple's authorised distributor",
        summary="Product launches, customer stories and raffles for Mercantile Pakistan, "
        "followed by 101K people.",
        industry=Industry.RETAIL,
        challenge="Mercantile is Apple's authorised distributor and service provider in "
        "Pakistan. Each launch needs clear, official messaging that still feels exciting.",
        strategy="- Launch content for every new iPhone\n"
        "- Highlights for testimonials, raffles and awards\n"
        "- Store and customer moments alongside product posts",
        execution="Launch visuals, pricing announcements, happy-customer posts and "
        "campaign highlights on Instagram.",
        results=[
            ("101K", "Instagram followers", "on the brand account"),
            ("1,253", "posts published", "on the feed"),
        ],
    ),
    Project(
        slug="mera-pakistan",
        client_name="Mera Pakistan",
        handle="merapakistannews",
        title="Building a new news brand from its first post",
        summary="A new digital news creator, set up with a strong visual identity from day one.",
        industry=Industry.MEDIA_NEWS,
        challenge="Mera Pakistan started from zero and needed to look credible next to "
        "established news pages straight away.",
        strategy="- A distinctive green and white news template\n"
        "- Urdu headlines designed for the feed\n"
        "- Consistent posting to build an audience from scratch",
        execution="Branded news cards covering national stories, public figures and sport.",
        results=[
            ("2,946", "Instagram followers", "since launch"),
            ("141", "posts published", "on the feed"),
        ],
    ),
]


def seed() -> str:
    now = clock.now()
    with Session(get_engine()) as session:
        # The old demo content used "sample-" slugs; it never belongs next to real work.
        samples = session.exec(select(CaseStudy).where(col(CaseStudy.slug).startswith("sample-")))
        removed = 0
        for sample in samples.all():
            session.exec(
                delete(CaseStudyResult).where(col(CaseStudyResult.case_study_id) == sample.id)
            )
            session.exec(
                delete(CaseStudyMedia).where(col(CaseStudyMedia.case_study_id) == sample.id)
            )
            session.delete(sample)
            removed += 1
        session.flush()

        existing = set(session.exec(select(CaseStudy.slug)).all())
        added = 0
        for order, project in enumerate(PROJECTS):
            if project.slug in existing:
                continue
            cover = static_media(
                session,
                f"/work/{project.slug}-cover.webp",
                f"The @{project.handle} Instagram profile with its follower count",
            )
            item = CaseStudy(
                slug=project.slug,
                client_name=project.client_name,
                title=project.title,
                summary=project.summary,
                industry=project.industry,
                country=Country.PAKISTAN,
                services=[Service.DIGITAL_MARKETING],
                cover_id=cover.id,
                sort_order=order,
                status=PublishStatus.PUBLISHED,
                published_at=now,
                last_published_at=now,
                challenge_md=project.challenge,
                strategy_md=project.strategy,
                execution_md=project.execution,
            )
            session.add(item)
            session.flush()
            for position, (value, label, period) in enumerate(project.results):
                session.add(
                    CaseStudyResult(
                        case_study_id=item.id,
                        value=value,
                        label=label,
                        period=period,
                        is_headline=True,
                        sort_order=position,
                    )
                )
            profile = static_media(
                session,
                f"/work/{project.slug}-profile.webp",
                f"The full @{project.handle} Instagram profile and recent posts",
            )
            session.add(
                CaseStudyMedia(
                    case_study_id=item.id, kind=CaseStudyMediaKind.IMAGE, media_id=profile.id
                )
            )
            added += 1
        session.commit()
    return f"Removed {removed} sample case studies; added {added} projects."
