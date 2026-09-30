"""Import every table model here so SQLModel.metadata is complete for Alembic and tests."""

from app.models.case_study import CaseStudy, CaseStudyMedia, CaseStudyResult, CaseStudySlugHistory
from app.models.content import ClientLogo, TeamMember, Testimonial
from app.models.email_delivery import EmailDelivery
from app.models.lead import Lead
from app.models.media import Media
from app.models.publishable import ContentActivity
from app.models.rate_limit import RateLimitHit
from app.models.user import (
    AuthSession,
    Invitation,
    LoginAttempt,
    PasswordReset,
    SecurityEvent,
    User,
)

__all__ = [
    "AuthSession",
    "CaseStudy",
    "CaseStudyMedia",
    "CaseStudyResult",
    "CaseStudySlugHistory",
    "ClientLogo",
    "ContentActivity",
    "EmailDelivery",
    "Invitation",
    "Lead",
    "LoginAttempt",
    "Media",
    "PasswordReset",
    "RateLimitHit",
    "SecurityEvent",
    "TeamMember",
    "Testimonial",
    "User",
]
