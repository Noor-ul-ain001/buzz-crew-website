"""Team account management, admin only (003 US4)."""

import uuid
from datetime import datetime
from typing import Annotated, Literal

from fastapi import Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlmodel import Session

from app.core.auth import Admin, admin_only_router
from app.core.database import get_session
from app.models.user import Invitation, User, UserRole, UserStatus
from app.services import user_service

router = admin_only_router(prefix="/api/v1", tags=["users"])

DbSession = Annotated[Session, Depends(get_session)]


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: UserRole
    status: UserStatus
    last_login_at: datetime | None
    invitation_expires_at: datetime | None


class InviteRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    name: str = Field(min_length=1, max_length=100)
    role: UserRole


class UserUpdate(BaseModel):
    role: UserRole | None = None
    status: Literal["active", "deactivated"] | None = None


def _out(user: User, invitation: Invitation | None = None) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        status=user.status,
        last_login_at=user.last_login_at,
        invitation_expires_at=invitation.expires_at if invitation else None,
    )


@router.get("/users", response_model=list[UserOut], operation_id="listUsers")
def list_users(session: DbSession) -> list[UserOut]:
    return [_out(user, inv) for user, inv in user_service.list_users(session)]


@router.post(
    "/invitations",
    status_code=status.HTTP_201_CREATED,
    response_model=UserOut,
    operation_id="inviteUser",
)
def invite_user(
    data: InviteRequest, current: Admin, request: Request, session: DbSession
) -> UserOut:
    user = user_service.invite(
        session,
        email=data.email,
        name=data.name,
        role=data.role,
        actor=current.user,
        request=request,
    )
    return _out(user)


@router.patch("/users/{user_id}", response_model=UserOut, operation_id="updateUser")
def update_user(
    user_id: uuid.UUID, data: UserUpdate, current: Admin, request: Request, session: DbSession
) -> UserOut:
    if data.role is None and data.status is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": "validation_error", "message": "Nothing to change."},
        )
    user = user_service.update_user(
        session,
        user_id,
        role=data.role,
        new_status=UserStatus(data.status) if data.status else None,
        actor=current.user,
        request=request,
    )
    return _out(user)


@router.post(
    "/users/{user_id}/invitation",
    status_code=status.HTTP_202_ACCEPTED,
    operation_id="resendInvitation",
)
def resend_invitation(
    user_id: uuid.UUID, current: Admin, request: Request, session: DbSession
) -> dict[str, str]:
    user_service.resend_invite(session, user_id, current.user, request)
    return {"message": "A new invitation link was sent."}


@router.delete(
    "/users/{user_id}/invitation",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="cancelInvitation",
)
def cancel_invitation(
    user_id: uuid.UUID, current: Admin, request: Request, session: DbSession
) -> None:
    user_service.cancel_invite(session, user_id, current.user, request)
