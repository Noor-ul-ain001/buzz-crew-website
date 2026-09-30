"""Admin-only leads: list, read, status changes, notes and delete."""

import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, HTTPException, status
from pydantic import BaseModel, StringConstraints
from sqlmodel import Session, col, select

from app.core.auth import Admin, admin_only_router
from app.core.database import get_session
from app.models.lead import (
    BudgetRange,
    Country,
    Lead,
    LeadEvent,
    LeadNote,
    LeadStatus,
    Service,
)

router = admin_only_router(prefix="/api/v1/leads", tags=["leads"])

DbSession = Annotated[Session, Depends(get_session)]
NOT_FOUND = {"code": "not_found", "message": "No such lead."}


class LeadNoteOut(BaseModel):
    id: uuid.UUID
    author_name: str
    body: str
    created_at: datetime


class LeadEventOut(BaseModel):
    id: uuid.UUID
    from_status: LeadStatus | None
    to_status: LeadStatus
    actor_name: str
    created_at: datetime


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
    notes: list[LeadNoteOut]
    events: list[LeadEventOut]


class LeadList(BaseModel):
    items: list[LeadOut]


class StatusChange(BaseModel):
    status: LeadStatus


class NewNote(BaseModel):
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


def _load(session: Session, leads: list[Lead]) -> list[LeadOut]:
    """Leads with their notes and history, in two queries rather than two per lead."""
    ids = [lead.id for lead in leads]
    notes: dict[uuid.UUID, list[LeadNoteOut]] = {lead_id: [] for lead_id in ids}
    events: dict[uuid.UUID, list[LeadEventOut]] = {lead_id: [] for lead_id in ids}
    if ids:
        for note in session.exec(
            select(LeadNote)
            .where(col(LeadNote.lead_id).in_(ids))
            .order_by(col(LeadNote.created_at))
        ).all():
            notes[note.lead_id].append(LeadNoteOut.model_validate(note, from_attributes=True))
        for event in session.exec(
            select(LeadEvent)
            .where(col(LeadEvent.lead_id).in_(ids))
            .order_by(col(LeadEvent.created_at))
        ).all():
            events[event.lead_id].append(LeadEventOut.model_validate(event, from_attributes=True))
    return [
        LeadOut.model_validate(
            {
                **lead.model_dump(),
                "notes": notes[lead.id],
                "events": events[lead.id],
            }
        )
        for lead in leads
    ]


def _get(session: Session, lead_id: uuid.UUID) -> Lead:
    lead = session.get(Lead, lead_id)
    if lead is None or lead.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)
    return lead


@router.get("", response_model=LeadList, operation_id="listLeads")
def list_leads(session: DbSession) -> LeadList:
    leads = session.exec(
        select(Lead).where(col(Lead.deleted_at).is_(None)).order_by(col(Lead.created_at).desc())
    ).all()
    return LeadList(items=_load(session, list(leads)))


@router.get("/{lead_id}", response_model=LeadOut, operation_id="getLead")
def get_lead(lead_id: uuid.UUID, session: DbSession) -> LeadOut:
    return _load(session, [_get(session, lead_id)])[0]


@router.patch("/{lead_id}", response_model=LeadOut, operation_id="updateLeadStatus")
def update_status(
    lead_id: uuid.UUID, data: StatusChange, current: Admin, session: DbSession
) -> LeadOut:
    lead = _get(session, lead_id)
    if lead.status != data.status:
        session.add(
            LeadEvent(
                lead_id=lead.id,
                from_status=lead.status,
                to_status=data.status,
                actor_name=current.user.name,
            )
        )
        lead.status = data.status
        lead.updated_at = datetime.now(UTC)
        session.add(lead)
        session.commit()
        session.refresh(lead)
    return _load(session, [lead])[0]


@router.post(
    "/{lead_id}/notes",
    response_model=LeadNoteOut,
    status_code=status.HTTP_201_CREATED,
    operation_id="addLeadNote",
)
def add_note(lead_id: uuid.UUID, data: NewNote, current: Admin, session: DbSession) -> LeadNoteOut:
    lead = _get(session, lead_id)
    note = LeadNote(
        lead_id=lead.id, author_id=current.user.id, author_name=current.user.name, body=data.body
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    return LeadNoteOut.model_validate(note, from_attributes=True)


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT, operation_id="deleteLead")
def delete_lead(lead_id: uuid.UUID, session: DbSession) -> None:
    # Soft delete: the row stays for the audit trail but leaves every admin list.
    lead = _get(session, lead_id)
    lead.deleted_at = datetime.now(UTC)
    session.add(lead)
    session.commit()
