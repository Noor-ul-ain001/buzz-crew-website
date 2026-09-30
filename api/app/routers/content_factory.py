"""Builds the admin and public routes for one content type (004 T008).

Admin: /api/v1/admin/content/{type} (admin or editor, CSRF via the session check).
Public: /api/v1/public/{type}, published and not deleted only, in the admin's order.
"""

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from sqlmodel import Session, col, select

from app.core.auth import Staff, staff_router
from app.core.database import get_session
from app.models.publishable import PublishStatus
from app.models.user import User
from app.services import publishing
from app.services.content_types import media_out
from app.services.publishing import ContentType, VersionConflict

DbSession = Annotated[Session, Depends(get_session)]


class ReorderRequest(BaseModel):
    ids: list[uuid.UUID]


def _pascal(slug: str) -> str:
    return "".join(part.title() for part in slug.split("-"))


def to_admin(session: Session, ct: ContentType, items: list[Any]) -> list[BaseModel]:
    media = publishing.load_media(session, ct, items)
    user_ids = {item.updated_by for item in items if item.updated_by}
    names = (
        {u.id: u.name for u in session.exec(select(User).where(col(User.id).in_(user_ids))).all()}
        if user_ids
        else {}
    )
    out: list[BaseModel] = []
    for item in items:
        data: dict[str, Any] = item.model_dump()
        thumbnail: str | None = None
        for name in ct.media_fields:
            image = publishing.media_for(item, name, media)
            data[name.removesuffix("_id")] = media_out(image)
            thumbnail = thumbnail or (image.url if image else None)
        if ct.admin_extra:
            data.update(ct.admin_extra(session, item))
        data["updated_by_name"] = names.get(item.updated_by)
        data["thumbnail_url"] = thumbnail
        out.append(ct.admin_schema.model_validate(data))
    return out


def build_content_routers(ct: ContentType) -> tuple[APIRouter, APIRouter]:
    admin = staff_router(prefix=f"/api/v1/admin/content/{ct.slug}", tags=["content"])
    public = APIRouter(prefix=f"/api/v1/public/{ct.slug}", tags=["public content"])
    name = _pascal(ct.slug)
    AdminOut = ct.admin_schema
    CreateIn = ct.create_schema
    UpdateIn = ct.update_schema
    PublicOut = ct.public_schema

    def one(session: Session, item: Any) -> BaseModel:
        return to_admin(session, ct, [item])[0]

    @admin.get("", response_model=list[AdminOut], operation_id=f"list{name}")  # pyright: ignore[reportInvalidTypeForm]
    def list_items(  # pyright: ignore[reportUnusedFunction]
        session: DbSession,
        status_filter: Annotated[PublishStatus | None, Query(alias="status")] = None,
    ) -> list[BaseModel]:
        return to_admin(session, ct, publishing.list_items(session, ct, status_filter))

    @admin.post(
        "",
        status_code=status.HTTP_201_CREATED,
        response_model=AdminOut,
        operation_id=f"create{name}",
    )
    def create_item(  # pyright: ignore[reportUnusedFunction]
        data: CreateIn,  # pyright: ignore[reportInvalidTypeForm, reportUnknownParameterType]
        current: Staff,
        session: DbSession,
    ) -> BaseModel:
        return one(session, publishing.create(session, ct, data, current.user))  # pyright: ignore[reportUnknownArgumentType]

    @admin.put("/order", status_code=status.HTTP_204_NO_CONTENT, operation_id=f"reorder{name}")
    def reorder(data: ReorderRequest, current: Staff, session: DbSession) -> Response:  # pyright: ignore[reportUnusedFunction]
        publishing.reorder(session, ct, data.ids, current.user)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @admin.get("/{item_id}", response_model=AdminOut, operation_id=f"get{name}")
    def get_item(item_id: uuid.UUID, session: DbSession) -> BaseModel:  # pyright: ignore[reportUnusedFunction]
        return one(session, publishing.get_item(session, ct, item_id))

    @admin.patch(
        "/{item_id}",
        response_model=AdminOut,
        operation_id=f"update{name}",
        responses={409: {"description": "version_conflict; `current` holds the latest item"}},
    )
    def update_item(  # pyright: ignore[reportUnusedFunction]
        item_id: uuid.UUID,
        data: UpdateIn,  # pyright: ignore[reportInvalidTypeForm, reportUnknownParameterType]
        current: Staff,
        session: DbSession,
    ) -> Any:
        try:
            updated = publishing.update(session, ct, item_id, data, current.user)  # pyright: ignore[reportUnknownArgumentType]
            return one(session, updated)
        except VersionConflict as conflict:
            latest = one(session, conflict.current)
            who = getattr(latest, "updated_by_name", None) or "someone else"
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "detail": {
                        "code": "version_conflict",
                        "message": f"Changed by {who} while you were editing.",
                        "current": latest.model_dump(mode="json"),
                    }
                },
            )

    @admin.delete(
        "/{item_id}", status_code=status.HTTP_204_NO_CONTENT, operation_id=f"delete{name}"
    )
    def delete_item(item_id: uuid.UUID, current: Staff, session: DbSession) -> Response:  # pyright: ignore[reportUnusedFunction]
        publishing.soft_delete(session, ct, item_id, current.user)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @admin.post("/{item_id}/publish", response_model=AdminOut, operation_id=f"publish{name}")
    def publish_item(item_id: uuid.UUID, current: Staff, session: DbSession) -> BaseModel:  # pyright: ignore[reportUnusedFunction]
        return one(session, publishing.publish(session, ct, item_id, current.user))

    @admin.post("/{item_id}/unpublish", response_model=AdminOut, operation_id=f"unpublish{name}")
    def unpublish_item(item_id: uuid.UUID, current: Staff, session: DbSession) -> BaseModel:  # pyright: ignore[reportUnusedFunction]
        return one(session, publishing.unpublish(session, ct, item_id, current.user))

    if ct.public_list:

        @public.get("", response_model=list[PublicOut], operation_id=f"public{name}")  # pyright: ignore[reportInvalidTypeForm]
        def public_items(session: DbSession) -> list[BaseModel]:  # pyright: ignore[reportUnusedFunction]
            items = publishing.list_public(session, ct)
            media = publishing.load_media(session, ct, items)
            return [out for item in items if (out := ct.to_public(item, media)) is not None]

    return admin, public
