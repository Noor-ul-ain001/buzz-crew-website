from typing import Any

from sqlalchemy import text

from app.jobs.content_jobs import cleanup_media
from tests.conftest import Clock, FakeMediaStore
from tests.content_helpers import TMP, create, sample_testimonial, upload


def test_cleanup_removes_only_old_unused_images(
    editor_client: Any, media_store: FakeMediaStore, clock: Clock, db: Any
) -> None:
    from tests.conftest import login

    login(editor_client, "editor@example.com")  # sign in again under the frozen clock
    used = upload(editor_client, media_store, name="used").json()
    create(editor_client, "testimonials", sample_testimonial(photo_id=used["id"]))
    orphan = upload(editor_client, media_store, name="orphan").json()
    media_store.tmp[f"{TMP}/abandoned"] = b"half-finished upload"

    assert cleanup_media() == 1  # only the abandoned tmp file; the orphan is too new
    clock.advance(hours=25)
    assert cleanup_media() == 1

    remaining = {str(r[0]) for r in db.execute(text("SELECT id FROM media"))}
    assert remaining == {used["id"]}
    assert orphan["id"] not in remaining
    assert "buzzcrew/photo/orphan" in media_store.deleted
