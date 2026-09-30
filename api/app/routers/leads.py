from datetime import timedelta
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, Request, status
from fastapi.concurrency import run_in_threadpool
from sqlmodel import Session

from app.core import rate_limit
from app.core.database import get_session
from app.models.email_delivery import EmailKind
from app.models.lead import LeadCreate, LeadCreated
from app.services import email_service, lead_service

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])
log = structlog.get_logger()

SUBMISSIONS_PER_HOUR = 5


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=LeadCreated,
    operation_id="createLead",
    summary="Submit a project inquiry (public)",
    responses={
        429: {"description": "Too many submissions from this visitor"},
    },
)
async def create_lead(
    data: LeadCreate,
    request: Request,
    session: Annotated[Session, Depends(get_session)],
) -> LeadCreated:
    # Order: per-visitor limit, then store (FR-019).
    await run_in_threadpool(
        rate_limit.hit,
        session,
        kind="lead_submit",
        key_hash=rate_limit.client_ip_hash(request),
        limit=SUBMISSIONS_PER_HOUR,
        window=timedelta(hours=1),
    )
    result = await run_in_threadpool(lead_service.create_lead, session, data)
    lead = result.lead
    # Log the id only; never personal data (constitution Principle V).
    log.info("lead_created" if result.created else "lead_repeated", lead_id=str(lead.id))
    if result.created:
        # Inline, before responding (DEPLOYMENT D4); failures are recorded, never raised.
        await run_in_threadpool(
            email_service.send_for_lead,
            session,
            lead,
            [EmailKind.TEAM_NOTIFICATION, EmailKind.CLIENT_CONFIRMATION],
        )
    return LeadCreated(
        id=lead.id,
        status=lead.status,
        created_at=lead.created_at,
        post_process_token=result.post_process_token,
    )
