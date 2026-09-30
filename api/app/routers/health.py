from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from app.core.database import get_session

router = APIRouter(prefix="/api/health", tags=["health"])


class HealthStatus(BaseModel):
    status: Literal["ok", "unavailable"]


@router.get("", response_model=HealthStatus, operation_id="health")
def health() -> HealthStatus:
    return HealthStatus(status="ok")


@router.get("/ready", response_model=HealthStatus, operation_id="ready")
def ready(response: Response, session: Annotated[Session, Depends(get_session)]) -> HealthStatus:
    try:
        session.connection().execute(text("SELECT 1"))
    except SQLAlchemyError:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthStatus(status="unavailable")
    return HealthStatus(status="ok")
