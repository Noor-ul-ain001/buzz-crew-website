from sqlmodel import Session

from app.core.database import get_engine
from app.services import auth_service


def prune_login_attempts() -> int:
    """Drop login/reset/invite attempt rows older than 24 hours (003 T039)."""
    with Session(get_engine()) as session:
        return auth_service.prune_login_attempts(session)
