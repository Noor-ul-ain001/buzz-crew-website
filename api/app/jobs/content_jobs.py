from datetime import timedelta

from sqlmodel import Session, SQLModel, col, select

from app.core import clock
from app.core.database import get_engine
from app.models.media import Media
from app.services import media_service
from app.services.media_store import get_store

ORPHAN_AGE = timedelta(hours=24)


def referenced_media_ids(session: Session) -> set[object]:
    """Every media id still referenced by any table (deleted items have already let go).

    Found from the schema itself, so new tables that point at `media` are covered too.
    """
    ids: set[object] = set()
    for table in SQLModel.metadata.sorted_tables:
        for column in table.columns:
            if any(fk.column.table.name == "media" for fk in column.foreign_keys):
                ids.update(session.exec(select(column).where(column.is_not(None))).all())
    return ids


def cleanup_media() -> int:
    """Delete images nobody uses after 24 hours, and abandoned temporary uploads (004 T033)."""
    cutoff = clock.now() - ORPHAN_AGE
    with Session(get_engine()) as session:
        used = referenced_media_ids(session)
        stale = session.exec(select(Media).where(col(Media.created_at) < cutoff)).all()
        removed = 0
        for media in stale:
            if media.id not in used:
                media_service.purge(session, media.id)
                removed += 1
        session.commit()
    removed += get_store().delete_older_than(f"{media_service.tmp_folder()}/", cutoff)
    return removed
