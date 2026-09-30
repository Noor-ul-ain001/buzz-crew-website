"""Sign-in, sessions and passwords (003 contracts/auth.openapi.yaml)."""

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlmodel import Session

from app.core.auth import CurrentUser, SignedIn
from app.core.database import get_session
from app.core.security import clear_session_cookie, set_session_cookie
from app.models.user import UserRole
from app.services import auth_service, user_service

router = APIRouter(prefix="/api/v1", tags=["auth"])

DbSession = Annotated[Session, Depends(get_session)]


class Me(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: UserRole
    session_expires_at: datetime
    idle_expires_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class NewPassword(BaseModel):
    token: str = Field(min_length=32, max_length=128)
    password: str = Field(min_length=1, max_length=128)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=1, max_length=128)


class ResetRequest(BaseModel):
    email: EmailStr


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    code: str = Field(min_length=1, max_length=128)


class Accepted(BaseModel):
    message: str


def _me(current: CurrentUser) -> Me:
    return Me(
        id=current.user.id,
        email=current.user.email,
        name=current.user.name,
        role=current.user.role,
        session_expires_at=current.session_expires_at,
        idle_expires_at=current.idle_expires_at,
    )


def _signed_in(response: Response, result: auth_service.SignedIn) -> Me:
    set_session_cookie(response, result.token)
    return _me(CurrentUser(user=result.user, session=result.session))


@router.post("/auth/login", response_model=Me, operation_id="login")
def login(data: LoginRequest, request: Request, response: Response, session: DbSession) -> Me:
    return _signed_in(response, auth_service.sign_in(session, data.email, data.password, request))


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT, operation_id="logout")
def logout(current: SignedIn, request: Request, response: Response, session: DbSession) -> None:
    auth_service.sign_out(session, current.session, request)
    clear_session_cookie(response)


@router.get("/auth/me", response_model=Me, operation_id="me")
def me(current: SignedIn) -> Me:
    return _me(current)


@router.post("/auth/session/extend", response_model=Me, operation_id="extendSession")
def extend_session(current: SignedIn, session: DbSession) -> Me:
    auth_service.extend(session, current.session)
    return _me(current)


@router.post(
    "/auth/password/change", status_code=status.HTTP_204_NO_CONTENT, operation_id="changePassword"
)
def change_password(
    data: PasswordChange, current: SignedIn, request: Request, session: DbSession
) -> None:
    auth_service.change_password(
        session, current.user, current.session, data.current_password, data.new_password, request
    )


@router.post(
    "/auth/password-reset/request",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=Accepted,
    operation_id="requestPasswordReset",
)
def request_password_reset(data: ResetRequest, request: Request, session: DbSession) -> Accepted:
    auth_service.request_reset(session, data.email, request)
    return Accepted(message=auth_service.RESET_ACCEPTED_MESSAGE)


@router.post(
    "/auth/password-reset/confirm",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="confirmPasswordReset",
)
def confirm_password_reset(data: NewPassword, request: Request, session: DbSession) -> None:
    auth_service.confirm_reset(session, data.token, data.password, request)


@router.post(
    "/auth/signup",
    response_model=Me,
    status_code=status.HTTP_201_CREATED,
    operation_id="signup",
    responses={
        403: {"description": "Wrong sign-up code"},
        404: {"description": "Sign-up is disabled"},
        409: {"description": "Account already exists"},
        429: {"description": "Too many attempts"},
    },
)
def signup(data: SignupRequest, request: Request, response: Response, session: DbSession) -> Me:
    return _signed_in(
        response,
        user_service.signup(
            session,
            name=data.name,
            email=data.email,
            password=data.password,
            code=data.code,
            request=request,
        ),
    )


@router.post("/invitations/accept", response_model=Me, operation_id="acceptInvitation")
def accept_invitation(
    data: NewPassword, request: Request, response: Response, session: DbSession
) -> Me:
    return _signed_in(
        response, user_service.accept_invite(session, data.token, data.password, request)
    )
