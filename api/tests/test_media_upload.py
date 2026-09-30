import io
from typing import Any

from PIL import Image

from tests.conftest import FakeMediaStore
from tests.content_helpers import TMP, create, publish, sample_testimonial, upload
from tests.fixtures.images import fake_jpg, logo_png, photo_ok_jpg, tiny_png, too_big_jpg


def test_signature_needs_staff(client: Any) -> None:
    assert client.post("/api/v1/uploads/signature", json={"usage": "photo"}).status_code == 401


def test_signature(editor_client: Any) -> None:
    response = editor_client.post("/api/v1/uploads/signature", json={"usage": "photo"})
    assert response.status_code == 200
    assert response.json()["folder"] == TMP


def test_fake_image_is_rejected_and_deleted(
    editor_client: Any, media_store: FakeMediaStore
) -> None:
    response = upload(editor_client, media_store, fake_jpg(), filename="cv.jpg")
    assert response.status_code == 415
    assert response.json()["detail"]["message"] == "Please choose a JPEG, PNG or WebP image"
    assert f"{TMP}/upload1" in media_store.deleted
    assert media_store.stored == {}


def test_too_big_image_is_rejected(editor_client: Any, media_store: FakeMediaStore) -> None:
    response = upload(editor_client, media_store, too_big_jpg())
    assert response.status_code == 413
    detail = response.json()["detail"]
    assert detail["limit_bytes"] == 5 * 1024 * 1024
    assert detail["size_bytes"] > detail["limit_bytes"]
    assert media_store.stored == {}


def test_small_photo_is_accepted_with_a_warning(
    editor_client: Any, media_store: FakeMediaStore
) -> None:
    response = upload(editor_client, media_store, tiny_png(), filename="tiny.png")
    assert response.status_code == 201
    assert response.json()["warnings"] == ["below_min_size"]
    ok = upload(editor_client, media_store, name="second")
    assert ok.json()["warnings"] == []


def test_exif_and_gps_are_removed(editor_client: Any, media_store: FakeMediaStore) -> None:
    original = Image.open(io.BytesIO(photo_ok_jpg()))
    assert original.getexif()  # the fixture really has EXIF
    assert upload(editor_client, media_store).status_code == 201
    (stored,) = media_store.stored.values()
    cleaned = Image.open(io.BytesIO(stored))
    assert not cleaned.getexif()
    assert "exif" not in cleaned.info


def test_png_transparency_is_kept(editor_client: Any, media_store: FakeMediaStore) -> None:
    response = upload(editor_client, media_store, logo_png(), usage="logo", filename="logo.png")
    assert response.status_code == 201
    (stored,) = media_store.stored.values()
    image = Image.open(io.BytesIO(stored))
    assert image.mode == "RGBA"
    pixel: Any = image.getpixel((0, 0))
    assert pixel[3] == 0


def test_uploads_outside_the_tmp_folder_are_refused(editor_client: Any) -> None:
    response = editor_client.post(
        "/api/v1/uploads/finalize", json={"public_id": "other/thing", "usage": "photo"}
    )
    assert response.status_code == 400


def test_alt_text_equal_to_file_name_blocks_publishing(
    editor_client: Any, media_store: FakeMediaStore
) -> None:
    media = upload(editor_client, media_store, alt="IMG_2041", filename="IMG_2041.jpg").json()
    item = create(editor_client, "testimonials", sample_testimonial(photo_id=media["id"]))
    response = publish(editor_client, "testimonials", item["id"])
    assert response.status_code == 422
    assert "file name" in response.json()["detail"]["fields"]["photo.alt_text"]
