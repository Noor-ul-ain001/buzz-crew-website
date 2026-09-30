"""Admin-only lead reading. Feature 004 extends this with filters, statuses and notes."""

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, col, select

from app.core.auth import admin_only_router
from app.core.database import get_session
from app.models.lead import BudgetRange, Country, Lead, LeadStatus, Service

router = admin_only_router(prefix="/api/v1/leads", tags=["leads"])

DbSession = Annotated[Session, Depends(get_session)]


class LeadOut(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    phone: str | None
    business: str | None
    country: Country
    services: list[Service]
    budget_range: BudgetRange
    message: str
    status: LeadStatus
    source_page: str
    created_at: datetime


class LeadList(BaseModel):
    items: list[LeadOut]


def _out(lead: Lead) -> LeadOut:
    return LeadOut.model_validate(lead, from_attributes=True)


@router.get("", response_model=LeadList, operation_id="listLeads")
def list_leads(session: DbSession) -> LeadList:
    leads = session.exec(
        select(Lead).where(col(Lead.deleted_at).is_(None)).order_by(col(Lead.created_at).desc())
    ).all()
    return LeadList(items=[_out(lead) for lead in leads])


@router.get("/{lead_id}", response_model=LeadOut, operation_id="getLead")
def get_lead(lead_id: uuid.UUID, session: DbSession) -> LeadOut:
    lead = session.get(Lead, lead_id)
    if lead is None or lead.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "No such lead."},
        )
    return _out(lead)
