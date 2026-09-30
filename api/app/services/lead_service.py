import hashlib
import secrets
from dataclasses import dataclass

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.models.lead import Lead, LeadCreate, LeadEvent


@dataclass
class CreateResult:
    lead: Lead
    post_process_token: str
    created: bool  # False when the idempotency key was already used (no emails re-sent)


def _new_post_process_token() -> tuple[str, str]:
    token = secrets.token_urlsafe(32)
    return token, hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_lead(
    session: Session, data: LeadCreate, *, source: str = "contact_form"
) -> CreateResult:
    """Store a lead with status `new`, or return the one already stored for this key."""
    token, token_hash = _new_post_process_token()

    existing = session.exec(
        select(Lead).where(Lead.idempotency_key == data.idempotency_key)
    ).first()
    if existing is not None:
        existing.post_process_token_hash = token_hash
        session.add(existing)
        session.commit()
        return CreateResult(lead=existing, post_process_token=token, created=False)

    lead = Lead(
        name=data.name,
        email=data.email,
        phone=data.phone,
        business=data.business,
        country=data.country,
        services=list(data.services),
        budget_range=data.budget_range,
        message=data.message,
        source=source,
        source_page=data.source_page,
        idempotency_key=data.idempotency_key,
        post_process_token_hash=token_hash,
    )
    session.add(lead)
    # The lead's history starts with its arrival (shown on the admin lead page).
    session.add(LeadEvent(lead_id=lead.id, to_status=lead.status, actor_name="Website form"))
    try:
        session.commit()
    except IntegrityError:
        # Two identical submissions raced; the other one won.
        session.rollback()
        return create_lead(session, data, source=source)
    session.refresh(lead)
    return CreateResult(lead=lead, post_process_token=token, created=True)
