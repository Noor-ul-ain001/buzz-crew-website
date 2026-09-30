"""CSRF defence for cookie-authenticated writes (research R3).

SameSite=Lax already blocks cross-site form posts; additionally, any unsafe request that
carries the session cookie must come from an allowlisted Origin.
"""

from fastapi import HTTPException, Request, status

from app.core.config import get_settings

UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
CSRF_FAILED = {"code": "csrf_failed", "message": "This request was blocked for your security."}


def verify_origin(request: Request) -> None:
    if request.method not in UNSAFE_METHODS:
        return
    settings = get_settings()
    if settings.session_cookie_name not in request.cookies:
        return
    origin = (request.headers.get("origin") or "").rstrip("/")
    if origin not in settings.client_origins:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=CSRF_FAILED)
