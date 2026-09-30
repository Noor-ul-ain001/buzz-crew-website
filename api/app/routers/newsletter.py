"""Newsletter sign-ups: a public subscribe endpoint and the admin list."""

import uuid
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, StringConstraints
from sqlmodel import Session, col, select

from app.core import rate_limit
from app.core.auth import admin_only_router
from app.core.database import get_session
from app.models.newsletter import NewsletterSubscriber

public = APIRouter(prefix="/api/v1/newsletter", tags=["newsletter"])
admin = admin_only_router(prefix="/api/v1/admin/subscribers", tags=["newsletter"])

DbSession = Annotated[Session, Depends(get_session)]
SUBSCRIBES_PER_HOUR = 10


class SubscribeRequest(BaseModel):
    email: Annotated[EmailStr, StringConstraints(max_length=254)]
    source_page: Annotated[str, StringConstraints(max_length=200, pattern=r"^/")] = "/"


class SubscriberOut(BaseModel):
    id: uuid.UUID
    email: str
    source_page: str
    created_at: datetime


@public.post("", status_code=status.HTTP_204_NO_CONTENT, operation_id="subscribe")
def subscribe(data: SubscribeRequest, request: Request, session: DbSession) -> None:
    rate_limit.hit(
        session,
        kind="newsletter_subscribe",
        key_hash=rate_limit.client_ip_hash(request),
        limit=SUBSCRIBES_PER_HOUR,
        window=timedelta(hours=1),
    )
    email = data.email.lower()
    # Signing up twice is fine and looks the same, so the form never reveals who's on the list.
    exists = session.exec(select(NewsletterSubscriber).where(NewsletterSubscriber.email == email))
    if exists.first() is None:
        session.add(NewsletterSubscriber(email=email, source_page=data.source_page))
        session.commit()


@admin.get("", response_model=list[SubscriberOut], operation_id="listSubscribers")
def list_subscribers(session: DbSession) -> list[SubscriberOut]:
    rows = session.exec(
        select(NewsletterSubscriber).order_by(col(NewsletterSubscriber.created_at).desc())
    ).all()
    return [SubscriberOut.model_validate(row, from_attributes=True) for row in rows]


@admin.delete(
    "/{subscriber_id}", status_code=status.HTTP_204_NO_CONTENT, operation_id="deleteSubscriber"
)
def delete_subscriber(subscriber_id: uuid.UUID, session: DbSession) -> None:
    row = session.get(NewsletterSubscriber, subscriber_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "No such subscriber."},
        )
    session.delete(row)
    session.commit()
