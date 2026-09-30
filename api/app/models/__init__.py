"""Import every table model here so SQLModel.metadata is complete for Alembic and tests."""

from app.models.case_study import CaseStudy, CaseStudyMedia, CaseStudyResult, CaseStudySlugHistory
from app.models.content import ClientLogo, Faq, Post, TeamMember, Testimonial
from app.models.email_delivery import EmailDelivery
from app.models.lead import Lead, LeadEvent, LeadNote
from app.models.media import Media
from app.models.newsletter import NewsletterSubscriber
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
    "Faq",
    "Invitation",
    "Lead",
    "LeadEvent",
    "LeadNote",
    "LoginAttempt",
    "Media",
    "NewsletterSubscriber",
    "PasswordReset",
    "Post",
    "RateLimitHit",
    "SecurityEvent",
    "TeamMember",
    "Testimonial",
    "User",
]
