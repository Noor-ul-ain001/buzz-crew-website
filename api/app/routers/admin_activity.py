"""Admin activity overview: daily counts, the lead pipeline and a recent-activity feed."""

import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Annotated, Any, Literal

from fastapi import Depends, Query
from pydantic import BaseModel
from sqlalchemy import Date, cast, func
from sqlmodel import Session, col, select

from app.core import clock
from app.core.auth import admin_only_router
from app.core.database import get_session
from app.models.case_study import CaseStudy
from app.models.content import ClientLogo, Faq, Post, TeamMember, Testimonial
from app.models.lead import Lead, LeadEvent, LeadNote, LeadStatus
from app.models.newsletter import NewsletterSubscriber
from app.models.publishable import ContentAction, ContentActivity
from app.models.user import User

router = admin_only_router(prefix="/api/v1/admin/activity", tags=["activity"])

DbSession = Annotated[Session, Depends(get_session)]
FEED_SIZE = 15

# content_activity.content_type → (model, the field that names an item, what to call it)
CONTENT: dict[str, tuple[Any, str, str]] = {
    "testimonial": (Testimonial, "name", "testimonial"),
    "client_logo": (ClientLogo, "name", "client logo"),
    "team_member": (TeamMember, "name", "team member"),
    "faq": (Faq, "question", "FAQ"),
    "post": (Post, "title", "post"),
    "case_study": (CaseStudy, "title", "case study"),
}

STATUS_LABELS = {
    LeadStatus.NEW: "New",
    LeadStatus.CONTACTED: "Contacted",
    LeadStatus.PROPOSAL_SENT: "Proposal sent",
    LeadStatus.WON: "Won",
    LeadStatus.LOST: "Lost",
}


class ActivityDay(BaseModel):
    date: date
    inquiries: int
    subscribers: int
    content: int
    lead_updates: int


class PipelineStage(BaseModel):
    status: LeadStatus
    count: int


class FeedItem(BaseModel):
    kind: Literal["inquiry", "lead_update", "note", "subscriber", "content"]
    text: str
    at: datetime
    lead_id: uuid.UUID | None = None


class ActivitySummary(BaseModel):
    days: list[ActivityDay]
    pipeline: list[PipelineStage]
    recent: list[FeedItem]


def _per_day(session: Session, column: Any, since: datetime, *where: Any) -> dict[date, int]:
    day = cast(func.timezone("UTC", column), Date)
    rows = session.exec(
        select(day, func.count()).where(column >= since, *where).group_by(day)  # pyright: ignore[reportArgumentType]
    ).all()
    return {row[0]: int(row[1]) for row in rows}


def _content_titles(session: Session, activity: list[ContentActivity]) -> dict[uuid.UUID, str]:
    titles: dict[uuid.UUID, str] = {}
    for name, (model, field, _) in CONTENT.items():
        ids = {a.content_id for a in activity if a.content_type == name}
        if ids:
            for item in session.exec(select(model).where(col(model.id).in_(ids))).all():
                titles[item.id] = getattr(item, field) or "Untitled"
    return titles


@router.get("", response_model=ActivitySummary, operation_id="getActivitySummary")
def activity_summary(
    session: DbSession, days: Annotated[int, Query(ge=7, le=90)] = 30
) -> ActivitySummary:
    today = clock.now().astimezone(UTC).date()
    first = today - timedelta(days=days - 1)
    since = datetime.combine(first, datetime.min.time(), tzinfo=UTC)

    inquiries = _per_day(session, Lead.created_at, since)
    subscribers = _per_day(session, NewsletterSubscriber.created_at, since)
    content = _per_day(
        session,
        ContentActivity.created_at,
        since,
        col(ContentActivity.action) != ContentAction.REORDERED,
    )
    status_changes = _per_day(
        session, LeadEvent.created_at, since, col(LeadEvent.from_status).is_not(None)
    )
    notes = _per_day(session, LeadNote.created_at, since)

    series = [
        ActivityDay(
            date=d,
            inquiries=inquiries.get(d, 0),
            subscribers=subscribers.get(d, 0),
            content=content.get(d, 0),
            lead_updates=status_changes.get(d, 0) + notes.get(d, 0),
        )
        for d in (first + timedelta(days=offset) for offset in range(days))
    ]

    counts = dict(
        session.exec(
            select(Lead.status, func.count())
            .where(col(Lead.deleted_at).is_(None))
            .group_by(Lead.status)  # pyright: ignore[reportArgumentType]
        ).all()
    )
    pipeline = [PipelineStage(status=s, count=int(counts.get(s, 0))) for s in LeadStatus]

    return ActivitySummary(days=series, pipeline=pipeline, recent=_recent(session))


def _recent(session: Session) -> list[FeedItem]:
    feed: list[FeedItem] = []
    # Deleted leads stay out of the feed: their pages no longer open.
    live = col(Lead.deleted_at).is_(None)
    for lead in session.exec(
        select(Lead).where(live).order_by(col(Lead.created_at).desc()).limit(FEED_SIZE)
    ):
        who = f"{lead.name} ({lead.business})" if lead.business else lead.name
        feed.append(
            FeedItem(
                kind="inquiry", text=f"New inquiry from {who}", at=lead.created_at, lead_id=lead.id
            )
        )

    events = session.exec(
        select(LeadEvent, Lead.name)
        .join(Lead, col(Lead.id) == LeadEvent.lead_id)
        .where(col(LeadEvent.from_status).is_not(None), live)
        .order_by(col(LeadEvent.created_at).desc())
        .limit(FEED_SIZE)
    ).all()
    for event, lead_name in events:
        feed.append(
            FeedItem(
                kind="lead_update",
                text=f"{event.actor_name} moved {lead_name} to {STATUS_LABELS[event.to_status]}",
                at=event.created_at,
                lead_id=event.lead_id,
            )
        )

    notes = session.exec(
        select(LeadNote, Lead.name)
        .join(Lead, col(Lead.id) == LeadNote.lead_id)
        .where(live)
        .order_by(col(LeadNote.created_at).desc())
        .limit(FEED_SIZE)
    ).all()
    for note, lead_name in notes:
        feed.append(
            FeedItem(
                kind="note",
                text=f"{note.author_name} added a note on {lead_name}",
                at=note.created_at,
                lead_id=note.lead_id,
            )
        )

    for sub in session.exec(
        select(NewsletterSubscriber)
        .order_by(col(NewsletterSubscriber.created_at).desc())
        .limit(FEED_SIZE)
    ):
        feed.append(
            FeedItem(kind="subscriber", text="New newsletter subscriber", at=sub.created_at)
        )

    activity = list(
        session.exec(
            select(ContentActivity)
            .where(col(ContentActivity.action) != ContentAction.REORDERED)
            .order_by(col(ContentActivity.created_at).desc())
            .limit(FEED_SIZE)
        ).all()
    )
    titles = _content_titles(session, activity)
    actor_ids = {a.actor_id for a in activity if a.actor_id}
    actors = (
        {u.id: u.name for u in session.exec(select(User).where(col(User.id).in_(actor_ids)))}
        if actor_ids
        else {}
    )
    for a in activity:
        _, _, noun = CONTENT.get(a.content_type, (None, "", a.content_type.replace("_", " ")))
        title = titles.get(a.content_id, "an item that was deleted")
        who = actors.get(a.actor_id, "Someone") if a.actor_id else "Someone"
        feed.append(
            FeedItem(
                kind="content", text=f"{who} {a.action.value} the {noun} “{title}”", at=a.created_at
            )
        )

    feed.sort(key=lambda item: item.at, reverse=True)
    return feed[:FEED_SIZE]
