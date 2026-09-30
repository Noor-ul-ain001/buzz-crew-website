"""Transactional email through Resend (free tier), with a delivery record per attempt.

Emails are sent inline after the lead is committed (specs/DEPLOYMENT.md D4): each has a
short timeout, failures are recorded, and nothing here ever raises to the caller (FR-014).
"""

from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as FutureTimeout
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import resend
import structlog
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlmodel import Session

from app.core.config import get_settings
from app.core.labels import BUDGET_LABELS, COUNTRY_LABELS, SERVICE_LABELS
from app.models.email_delivery import EmailDelivery, EmailKind, EmailStatus
from app.models.lead import Lead

log = structlog.get_logger()

_TEMPLATES = Path(__file__).resolve().parents[1] / "templates" / "email"
_html_env = Environment(
    loader=FileSystemLoader(_TEMPLATES), autoescape=select_autoescape(["html"]), auto_reload=False
)
# Plain-text bodies are not HTML, so they must not be HTML-escaped.
_text_env = Environment(loader=FileSystemLoader(_TEMPLATES), autoescape=False, auto_reload=False)  # noqa: S701


@dataclass(frozen=True)
class OutgoingEmail:
    kind: EmailKind
    to: str
    subject: str
    html: str
    text: str
    reply_to: str | None = None


def _deliver(params: dict[str, Any]) -> str:
    """Hand one message to the provider and return its message id. Replaced by a fake in tests."""
    if get_settings().email_provider == "fake":
        return "fake"
    resend.api_key = get_settings().resend_api_key
    response: Any = resend.Emails.send(params)  # pyright: ignore[reportArgumentType]
    return str(response["id"])


def _context(lead: Lead) -> dict[str, Any]:
    return {
        "lead": lead,
        "country": COUNTRY_LABELS[lead.country],
        "services": ", ".join(SERVICE_LABELS[s] for s in lead.services),
        "budget": BUDGET_LABELS[lead.budget_range],
        "received": lead.created_at.astimezone(UTC).strftime("%d %b %Y, %H:%M UTC"),
        "contact_email": get_settings().team_notification_email,
    }


def render(kind: EmailKind, lead: Lead) -> OutgoingEmail:
    context = _context(lead)
    html = _html_env.get_template(f"{kind.value}.html").render(context)
    text = _text_env.get_template(f"{kind.value}.txt").render(context)
    settings = get_settings()
    if kind is EmailKind.TEAM_NOTIFICATION:
        return OutgoingEmail(
            kind=kind,
            to=settings.team_notification_email,
            subject=f"New inquiry: {lead.name}",
            html=html,
            text=text,
            reply_to=lead.email,
        )
    return OutgoingEmail(
        kind=kind,
        to=lead.email,
        subject="We've received your inquiry — The Buzz Crew",
        html=html,
        text=text,
    )


def _params(email: OutgoingEmail) -> dict[str, Any]:
    params: dict[str, Any] = {
        "from": get_settings().email_from,
        "to": [email.to],
        "subject": email.subject,
        "html": email.html,
        "text": email.text,
    }
    if email.reply_to:
        params["reply_to"] = email.reply_to
    return params


def send_for_lead(session: Session, lead: Lead, kinds: list[EmailKind]) -> None:
    """Send the given emails concurrently and record each outcome."""
    timeout = get_settings().email_timeout_seconds
    emails = [render(kind, lead) for kind in kinds]
    with ThreadPoolExecutor(max_workers=len(emails) or 1) as pool:
        futures = [(email, pool.submit(_deliver, _params(email))) for email in emails]
        for email, future in futures:
            try:
                message_id = future.result(timeout=timeout)
                record = EmailDelivery(
                    lead_id=lead.id,
                    kind=email.kind,
                    status=EmailStatus.SENT,
                    provider_message_id=message_id[:100],
                )
            except FutureTimeout:
                record = _failed(lead, email.kind, "provider_timeout")
            except Exception as exc:  # noqa: BLE001 — provider errors must never fail the request
                record = _failed(lead, email.kind, _error_code(exc))
            session.add(record)
            log.info(
                "email_delivery",
                lead_id=str(lead.id),
                kind=email.kind.value,
                status=record.status.value,
                error_code=record.error_code,
            )
    session.commit()


def _failed(lead: Lead, kind: EmailKind, code: str) -> EmailDelivery:
    return EmailDelivery(
        lead_id=lead.id,
        kind=kind,
        status=EmailStatus.FAILED,
        error_code=code,
        attempted_at=datetime.now(UTC),
    )


def _error_code(exc: Exception) -> str:
    # A short class-based code; never the message (it can contain the recipient address).
    name = type(exc).__name__
    return f"provider_error:{name}"[:60]


def send_message(to: str, subject: str, template: str, context: dict[str, Any]) -> bool:
    """Send a non-lead email (sign-in, invitations, notices). Never raises; logs no addresses."""
    base = {
        "web_url": get_settings().web_url,
        "contact_email": get_settings().team_notification_email,
    }
    merged = {**base, **context}
    params: dict[str, Any] = {
        "from": get_settings().email_from,
        "to": [to],
        "subject": subject,
        "html": _html_env.get_template(f"{template}.html").render(merged),
        "text": _text_env.get_template(f"{template}.txt").render(merged),
    }
    with ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(_deliver, params)
        try:
            future.result(timeout=get_settings().email_timeout_seconds)
        except FutureTimeout:
            log.warning("email_message_failed", template=template, error_code="provider_timeout")
            return False
        except Exception as exc:  # noqa: BLE001 — provider errors must never break the flow
            log.warning("email_message_failed", template=template, error_code=_error_code(exc))
            return False
    log.info("email_message_sent", template=template)
    return True
