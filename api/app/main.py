import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import RequestIdMiddleware, configure_logging
from app.routers import (
    admin_leads,
    auth,
    health,
    leads,
    newsletter,
    public_case_studies,
    uploads,
    users,
)
from app.routers.content_factory import build_content_routers
from app.services.case_study_service import CASE_STUDIES
from app.services.content_types import CONTENT_TYPES

log = structlog.get_logger()


def create_app() -> FastAPI:
    configure_logging()
    settings = get_settings()

    app = FastAPI(title="The Buzz Crew API", version="1.0.0")

    # Browser traffic arrives same-origin through the web app's rewrite (DEPLOYMENT D2);
    # the allowlist is kept as a safety net and is never "*".
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.client_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
        allow_headers=["Content-Type", "X-Request-ID", "X-Visitor-Id"],
    )
    app.add_middleware(RequestIdMiddleware)

    @app.exception_handler(Exception)
    async def unhandled_error(request: Request, exc: Exception) -> JSONResponse:  # pyright: ignore[reportUnusedFunction]
        # No stack traces or internal details reach clients (constitution Principle III).
        log.error("unhandled_error", path=request.url.path, error_type=type(exc).__name__)
        return JSONResponse(
            status_code=500,
            content={"detail": {"code": "internal_error", "message": "Something went wrong."}},
        )

    app.include_router(health.router)
    app.include_router(leads.router)
    app.include_router(admin_leads.router)
    app.include_router(newsletter.public)
    app.include_router(newsletter.admin)
    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(uploads.router)
    app.include_router(uploads.media_router)
    for content_type in (*CONTENT_TYPES, CASE_STUDIES):
        admin_router, public_router = build_content_routers(content_type)
        app.include_router(admin_router)
        app.include_router(public_router)
    app.include_router(public_case_studies.router)
    return app


app = create_app()
