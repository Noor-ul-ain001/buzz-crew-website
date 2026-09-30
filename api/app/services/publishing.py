"""Draft → publish → unpublish, ordering, versions and activity for every content type
(004 T005). Features 005 and 007 register their own ContentTypes and reuse all of this.
"""

import uuid
from collections.abc import Callable, Iterable, Sequence
from dataclasses import dataclass
from typing import Any, cast

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlmodel import Session, col, select

from app.core import clock
from app.models.media import Media
from app.models.publishable import ContentAction, ContentActivity, PublishableMixin, PublishStatus
from app.models.user import User
from app.services import media_service, revalidation

MediaMap = dict[uuid.UUID, Media]
Rules = Callable[[Any, MediaMap], dict[str, str]]


@dataclass(frozen=True)
class ContentType:
    slug: str  # URL segment, e.g. "testimonials"
    activity_name: str  # content_activity.content_type, e.g. "testimonial"
    label: str  # "testimonial", for messages
    model: type[PublishableMixin]
    create_schema: type[BaseModel]
    update_schema: type[BaseModel]  # includes `version`
    admin_schema: type[BaseModel]
    public_schema: type[BaseModel]
    media_fields: tuple[str, ...]
    rules: Rules
    to_public: Callable[[Any, MediaMap], BaseModel | None]
    tags: tuple[str, ...]
    # Optional hooks for richer types (005 case studies, 007 posts).
    # Payload keys stored in child tables rather than on the item itself.
    nested_fields: tuple[str, ...] = ()
    # Validate or adjust scalar changes before they're applied (item is None on create).
    # Returns extra cache tags to refresh, e.g. an old slug's page.
    before_save: Callable[[Session, Any, dict[str, Any]], list[str]] | None = None
    # Write the nested payload (only keys that were sent) after the item row exists.
    apply_nested: Callable[[Session, Any, dict[str, Any]], None] | None = None
    # Checks that need the database (children, uniqueness), merged with `rules`.
    extra_rules: Callable[[Session, Any], dict[str, str]] | None = None
    # Extra fields for the admin response (children, resolved images).
    admin_extra: Callable[[Session, Any], dict[str, Any]] | None = None
    # Per-item cache tags, e.g. ("case-study:{slug}",).
    item_tags: Callable[[Any], list[str]] | None = None
    # On delete: remove children and return the media ids they held, to purge.
    on_delete: Callable[[Session, Any], list[uuid.UUID]] | None = None
    # False when the type has its own public routes instead of the plain list.
    public_list: bool = True


# Later features hook in here (005 tags, 008 knowledge chunks). Called after each commit.
AfterCommit = Callable[[Session, ContentType, Any, ContentAction], None]
AFTER_COMMIT: list[AfterCommit] = []


def not_found(ct: ContentType) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "not_found", "message": f"No such {ct.label}."},
    )


def load_media(session: Session, ct: ContentType, items: Iterable[Any]) -> MediaMap:
    ids = {
        media_id
        for item in items
        for name in ct.media_fields
        if (media_id := getattr(item, name)) is not None
    }
    if not ids:
        return {}
    return {m.id: m for m in session.exec(select(Media).where(col(Media.id).in_(ids))).all()}


def media_for(item: Any, name: str, media: MediaMap) -> Media | None:
    media_id = getattr(item, name)
    return media.get(media_id) if media_id else None


def publish_errors(session: Session, ct: ContentType, item: Any) -> dict[str, str]:
    errors = ct.rules(item, load_media(session, ct, [item]))
    if ct.extra_rules:
        errors.update(ct.extra_rules(session, item))
    return errors


def cache_tags(ct: ContentType, item: Any, extra: Iterable[str] = ()) -> list[str]:
    tags = [*ct.tags, *extra]
    if ct.item_tags:
        tags.extend(ct.item_tags(item))
    return tags


def _split_nested(ct: ContentType, values: dict[str, Any]) -> dict[str, Any]:
    return {name: values.pop(name) for name in ct.nested_fields if name in values}


def _raise_if_not_publishable(session: Session, ct: ContentType, item: Any) -> None:
    errors = publish_errors(session, ct, item)
    if errors:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "publish_requirements_not_met",
                "message": f"This {ct.label} isn't ready to publish yet.",
                "fields": errors,
            },
        )


def record_activity(
    session: Session, ct: ContentType, item_id: uuid.UUID, action: ContentAction, actor: User
) -> None:
    session.add(
        ContentActivity(
            content_type=ct.activity_name, content_id=item_id, action=action, actor_id=actor.id
        )
    )


def _after_commit(session: Session, ct: ContentType, item: Any, action: ContentAction) -> None:
    for hook in AFTER_COMMIT:
        hook(session, ct, item, action)


def _check_media_exists(session: Session, ct: ContentType, values: dict[str, Any]) -> None:
    for name in ct.media_fields:
        media_id = values.get(name)
        if media_id is not None and session.get(Media, media_id) is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail={
                    "code": "invalid_media",
                    "message": "That image couldn't be found. Please upload it again.",
                    "fields": {name.removesuffix("_id"): "Please upload the image again."},
                },
            )


def get_item(session: Session, ct: ContentType, item_id: uuid.UUID, *, lock: bool = False) -> Any:
    query = select(ct.model).where(col(ct.model.id) == item_id, col(ct.model.deleted_at).is_(None))
    if lock:
        query = query.with_for_update()
    item = session.exec(query).first()
    if item is None:
        raise not_found(ct)
    return item


def list_items(session: Session, ct: ContentType, status_filter: PublishStatus | None) -> list[Any]:
    query = select(ct.model).where(col(ct.model.deleted_at).is_(None))
    if status_filter is not None:
        query = query.where(col(ct.model.status) == status_filter)
    return list(
        session.exec(query.order_by(col(ct.model.sort_order), col(ct.model.created_at))).all()
    )


def list_public(session: Session, ct: ContentType) -> list[Any]:
    """The public visibility rule: published and not deleted, in the admin's order."""
    return list(
        session.exec(
            select(ct.model)
            .where(
                col(ct.model.status) == PublishStatus.PUBLISHED,
                col(ct.model.deleted_at).is_(None),
            )
            .order_by(col(ct.model.sort_order), col(ct.model.created_at))
        ).all()
    )


def create(session: Session, ct: ContentType, data: BaseModel, actor: User) -> Any:
    """Always a draft; drafts skip the publish checks."""
    values = data.model_dump()
    nested = _split_nested(ct, values)
    _check_media_exists(session, ct, values)
    if ct.before_save:
        ct.before_save(session, None, values)
    last = cast(
        int | None,
        session.exec(
            select(func.max(ct.model.sort_order)).where(col(ct.model.deleted_at).is_(None))
        ).one(),
    )
    item = ct.model(
        **values,
        sort_order=(last if last is not None else -1) + 1,
        created_by=actor.id,
        updated_by=actor.id,
    )
    session.add(item)
    session.flush()
    if ct.apply_nested and nested:
        ct.apply_nested(session, item, nested)
    record_activity(session, ct, item.id, ContentAction.CREATED, actor)
    session.commit()
    session.refresh(item)
    _after_commit(session, ct, item, ContentAction.CREATED)
    return item


def _touch(item: Any, actor: User) -> None:
    item.version += 1
    item.updated_by = actor.id
    item.updated_at = clock.now()


class VersionConflict(Exception):
    def __init__(self, current: Any) -> None:
        self.current = current


def update(
    session: Session, ct: ContentType, item_id: uuid.UUID, data: BaseModel, actor: User
) -> Any:
    item = get_item(session, ct, item_id, lock=True)
    changes = data.model_dump(exclude_unset=True)
    version = changes.pop("version")
    if version != item.version:
        session.rollback()
        raise VersionConflict(get_item(session, ct, item_id))
    nested = _split_nested(ct, changes)
    _check_media_exists(session, ct, changes)
    extra_tags = ct.before_save(session, item, changes) if ct.before_save else []
    for name, value in changes.items():
        setattr(item, name, value)
    if ct.apply_nested and nested:
        ct.apply_nested(session, item, nested)
        session.flush()
    # A published item stays published only if it still passes the checks.
    if item.status is PublishStatus.PUBLISHED:
        _raise_if_not_publishable(session, ct, item)
    _touch(item, actor)
    record_activity(session, ct, item.id, ContentAction.UPDATED, actor)
    session.commit()
    session.refresh(item)
    if item.status is PublishStatus.PUBLISHED:
        revalidation.revalidate(cache_tags(ct, item, extra_tags))
    _after_commit(session, ct, item, ContentAction.UPDATED)
    return item


def publish(session: Session, ct: ContentType, item_id: uuid.UUID, actor: User) -> Any:
    item = get_item(session, ct, item_id, lock=True)
    _raise_if_not_publishable(session, ct, item)
    now = clock.now()
    item.status = PublishStatus.PUBLISHED
    item.published_at = item.published_at or now
    item.last_published_at = now
    _touch(item, actor)
    record_activity(session, ct, item.id, ContentAction.PUBLISHED, actor)
    session.commit()
    session.refresh(item)
    revalidation.revalidate(cache_tags(ct, item))
    _after_commit(session, ct, item, ContentAction.PUBLISHED)
    return item


def unpublish(session: Session, ct: ContentType, item_id: uuid.UUID, actor: User) -> Any:
    item = get_item(session, ct, item_id, lock=True)
    item.status = PublishStatus.DRAFT
    _touch(item, actor)
    record_activity(session, ct, item.id, ContentAction.UNPUBLISHED, actor)
    session.commit()
    session.refresh(item)
    revalidation.revalidate(cache_tags(ct, item))
    _after_commit(session, ct, item, ContentAction.UNPUBLISHED)
    return item


def soft_delete(session: Session, ct: ContentType, item_id: uuid.UUID, actor: User) -> None:
    item = get_item(session, ct, item_id, lock=True)
    was_published = item.status is PublishStatus.PUBLISHED
    media_ids = [getattr(item, name) for name in ct.media_fields]
    if ct.on_delete:
        media_ids.extend(ct.on_delete(session, item))
    for name in ct.media_fields:
        setattr(item, name, None)
    item.deleted_at = clock.now()
    _touch(item, actor)
    session.flush()
    for media_id in media_ids:
        media_service.purge(session, media_id)
    record_activity(session, ct, item.id, ContentAction.DELETED, actor)
    session.commit()
    if was_published:
        revalidation.revalidate(cache_tags(ct, item))
    _after_commit(session, ct, item, ContentAction.DELETED)


def reorder(session: Session, ct: ContentType, ids: Sequence[uuid.UUID], actor: User) -> None:
    """Apply the given order in one transaction. Items not in `ids` (for example one added
    meanwhile by someone else) keep their relative order after the listed ones."""
    items = list(
        session.exec(
            select(ct.model)
            .where(col(ct.model.deleted_at).is_(None))
            .order_by(col(ct.model.sort_order), col(ct.model.created_at))
            .with_for_update()
        ).all()
    )
    by_id = {item.id: item for item in items}
    listed = [by_id[item_id] for item_id in dict.fromkeys(ids) if item_id in by_id]
    listed_ids = {item.id for item in listed}
    ordered = listed + [item for item in items if item.id not in listed_ids]
    for position, item in enumerate(ordered):
        if item.sort_order != position:
            item.sort_order = position
            record_activity(session, ct, item.id, ContentAction.REORDERED, actor)
    session.commit()
    if any(item.status is PublishStatus.PUBLISHED for item in ordered):
        revalidation.revalidate(list(ct.tags))
