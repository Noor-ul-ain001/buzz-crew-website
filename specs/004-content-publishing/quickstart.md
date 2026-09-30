# Quickstart: Content Management and Publishing

## Prerequisites

Features 001 and 003 are running, and you are signed in as an editor. Additional environment:

```text
# api/.env
CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud>
CLOUDINARY_FOLDER=buzzcrew/dev
WEB_URL=http://localhost:3000
REVALIDATE_SECRET=<random 32 bytes>
# web/.env.local
REVALIDATE_SECRET=<same value>
NEXT_PUBLIC_CLOUDINARY_CLOUD=<cloud>
```

```bash
cd api && uv run alembic upgrade head && uv run pytest tests/test_media_upload.py tests/test_publish_rules.py tests/test_public_visibility.py tests/test_reorder.py tests/test_concurrency.py
cd web && npx vitest run components/admin/content && npx playwright test e2e/content-publishing.spec.ts
```

Fixtures under `api/tests/fixtures/`: `photo_ok.jpg` (with GPS EXIF), `too_big.jpg` (6 MB), `fake.jpg` (a PDF renamed), `tiny.png` (100×100), `logo.png` (transparent).

## Validation scenarios

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Create a testimonial with a name and quote, then Save draft (US1) | Status Draft; `GET /api/v1/public/testimonials` does not include it; the home page does not show it |
| 2 | Publish without photo alternative text | 422 with `photo.alt_text` error shown next to the field; stays Draft |
| 3 | Add alternative text, then Publish | Appears on the home page on the next request (and certainly within 5 minutes) |
| 4 | Unpublish | Disappears from the home page on the next request; still in the admin list as Draft |
| 5 | Upload `fake.jpg` / `too_big.jpg` (US2) | "Please choose a JPEG, PNG or WebP image" / "This file is 6.0 MB; the limit is 5 MB"; no `media` row |
| 6 | Upload `photo_ok.jpg` | Preview appears before saving; the stored Cloudinary image has no EXIF or GPS (`exiftool` shows none) |
| 7 | Upload `tiny.png` as a photo | Warning that it will look blurry; still allowed |
| 8 | Reorder logos by keyboard (Space, Arrow, Space) and with Move up (US3) | The new order is shown on the home page logo strip |
| 9 | Remove a logo (confirm) | Gone from the admin list and the public site; its Cloudinary image deleted |
| 10 | Two browsers edit the same testimonial; save both | The second gets "Changed by {name}…" with a choice (409) |
| 11 | Stop the web server's revalidate route (simulate webhook failure), then publish | Change visible within 5 minutes via the revalidate safety net; a warning is logged |
| 12 | `curl` POST `/api/v1/admin/content/testimonials` without a cookie | 401 |

Contracts: [contracts/content.openapi.yaml](./contracts/content.openapi.yaml). Data model: [data-model.md](./data-model.md).
