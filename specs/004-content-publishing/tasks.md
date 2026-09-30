---
description: "Task list for 004 Content Management and Publishing"
---

# Tasks: Content Management and Publishing

**Input**: `specs/004-content-publishing/` (plan, spec, research, data-model, contracts/content.openapi.yaml, quickstart), plus `specs/DEPLOYMENT.md`

**Prerequisites**: 001 (layout, database, rate limits) and 003 (`require_role`, CSRF) are complete.

**Tests**: Included (constitution Principle IV; Playwright for publishing a testimonial).

**Deployment note**: images upload **directly to Cloudinary with a signature**, then the API finalises and validates them (DEPLOYMENT D6; replaces research R2's multipart upload). Media cleanup runs in the daily cron (D5).

---

## Phase 1: Setup

- [X] T001 Create branch `004-content-publishing`; add `Pillow` and `cloudinary` to `api/pyproject.toml`; add `CLOUDINARY_URL`, `CLOUDINARY_FOLDER`, `WEB_URL` and `REVALIDATE_SECRET` to `api/.env.example`, and `REVALIDATE_SECRET` and `NEXT_PUBLIC_CLOUDINARY_CLOUD` to `web/.env.example` (Cloudinary free plan; see COSTS.md)
- [X] T002 [P] Add test fixtures under `api/tests/fixtures/`: `photo_ok.jpg` (with GPS EXIF), `too_big.jpg` (6 MB), `fake.jpg` (a renamed PDF), `tiny.png` (100×100), `logo.png` (transparent)

---

## Phase 2: Foundational – the reusable publishing pattern (blocking; reused by 005 and 007)

- [X] T003 Create `api/app/models/publishable.py`:
  - **Enum** `publish_status` (`draft`, `published`).
  - **`PublishableMixin`**: `id` UUID; `status` default `draft`; `sort_order` int; `version` int "starts at 1; incremented on each update"; `published_at` "set on first publish"; `last_published_at`; `created_by`, `updated_by` FK → users; `created_at`, `updated_at`; `deleted_at` "soft delete: hidden from admin and public".
  - **`content_activity`** table: `content_type` varchar(40); `content_id` UUID; `action` enum (`created`,`updated`,`published`,`unpublished`,`reordered`,`deleted`); `actor_id`; `created_at`.
  - Add an Alembic migration.
- [X] T004 Create `api/app/models/media.py`, `media` table per data-model.md: `provider_public_id` varchar(255); `url` varchar(500); `alt_text` varchar(150) nullable "required (5–150 characters, ≠ file name) before the owning item can publish"; `original_filename`; `mime_type` enum (`image/jpeg`,`image/png`,`image/webp`); `width`; `height`; `size_bytes` "≤ 5,242,880"; `uploaded_by`; `created_at`. Add an Alembic migration.
- [X] T005 Implement `api/app/services/publishing.py`:
  - `can_publish(item, rules) -> list[FieldError]`: required fields; media alt text 5–150 characters, not equal to the file name with or without extension; the video host allowlist `youtube.com`, `youtu.be`, `vimeo.com`, `instagram.com`;
  - `publish`, `unpublish`, `save` (runs the publish checks when the item is published);
  - `soft_delete` (purges images);
  - `reorder(ids)` (one transaction; ids missing from the list keep their relative order at the end);
  - a version check that raises 409 `version_conflict` with the current item;
  - `record_activity`;
  - an `after_commit` hook list that later features extend: 005's tags, 008's knowledge chunks.
- [X] T006 Implement `api/app/services/revalidation.py` `revalidate(tags)`: POST `{tags}` to `WEB_URL/api/revalidate` with an HMAC-SHA256 header over the body, a 3 s timeout and 1 retry; log failures and never raise
- [X] T007 Create `web/app/api/revalidate/route.ts`: verify the HMAC with `REVALIDATE_SECRET` using a timing-safe comparison, then `revalidateTag(tag, { expire: 0 })` for each tag (Next 16 requires the second argument); return 401 on a bad signature
- [X] T008 Implement `api/app/routers/content_factory.py`: a generic router factory producing, for a content type, `GET` (with a `status` filter) and `POST /admin/content/{type}`, `GET`, `PATCH` (with `version`) and `DELETE /{id}`, `POST /{id}/publish`, `POST /{id}/unpublish` and `PUT /order`, all with `require_role("admin","editor")` and CSRF, plus a public `GET /public/{type}` that returns only `status='published' AND deleted_at IS NULL`, ordered by `sort_order`
- [X] T009 [P] Tests in `api/tests/test_publishing_core.py`: a draft save skips the checks; publishing enforces them; a published edit enforces them; soft-deleted and draft items never appear on public routes; version conflict; reorder with a concurrent new item; activity rows are written; a revalidation call is made (mocked)

**Checkpoint**: The pattern is ready for 005 and 007.

---

## Phase 3: User Story 1 – Draft and publish a testimonial (P1) 🎯 MVP

**Goal**: The draft → publish → unpublish workflow for testimonials, visible on the home page within 5 minutes.

**Independent Test**: A draft doesn't appear on the site. Publishing shows it on the next request, and unpublishing removes it. Publishing without the quote or photo alternative text is refused with field errors.

- [X] T010 [P] [US1] Tests in `api/tests/test_testimonials.py`:
  - required fields: name, role and company ≤ 100 characters, country enum, "quote 20–400 characters";
  - photo alternative text is required only when a photo is present;
  - a video URL outside the allowlist returns 422 with "Accepted links: YouTube, Vimeo, Instagram";
  - the public shape matches `PublicTestimonial` in `contracts/content.openapi.yaml`.
- [X] T011 [P] [US1] Playwright test in `web/e2e/content-publishing.spec.ts`: an editor creates a draft (not on `/`), publishes it (appears on `/`) and unpublishes it (gone)
- [X] T012 [US1] Create the `testimonials` table in `api/app/models/content.py` (+ PublishableMixin): `name` varchar(100), `role` varchar(100), `company` varchar(100), `country` `lead_country`, `quote` varchar(400) "20–400", `photo_id` FK → media nullable, `video_url` varchar(300) nullable. Add the Create, Update and Public schemas and an Alembic migration.
- [X] T013 [US1] Register the testimonials routes through the T008 factory in `api/app/routers/admin_content.py` and `api/app/routers/public_content.py`, with the tag `testimonials`
- [X] T014 [US1] Create `web/lib/content/public.ts` `getPublishedTestimonials()` using `fetch(\`${API_ORIGIN}/api/v1/public/testimonials\`, { next: { tags: ["testimonials"], revalidate: 300 } })`, and replace the mock import in `web/app/(site)/page.tsx`; the section stays hidden when the list is empty
- [X] T015 [US1] Wire the existing testimonial admin screens (`web/app/admin/content/testimonials/page.tsx`, `new/page.tsx`, `[id]/page.tsx`) to the generated API client: Save draft, Publish, Unpublish, field errors next to each field, a version-conflict dialog ("Changed by {name} at {time}", Review or Overwrite), and an unsaved-changes guard (`beforeunload` plus in-app navigation prompt)
- [X] T016 [US1] Show the video link on `web/components/home/TestimonialCard.tsx` as a labelled link opening in a new tab (`rel="noopener noreferrer"`, visually hidden "(opens in a new tab)")

---

## Phase 4: User Story 2 – Image upload with preview and alternative text (P1)

**Goal**: Safe uploads with an instant preview, clear errors and required alternative text.

**Independent Test**: A JPEG under 5 MB previews before saving and its stored copy has no EXIF. A PDF renamed `.jpg` and a 6 MB image are rejected with the exact messages, and nothing is stored. Publishing without alternative text is refused.

- [X] T017 [P] [US2] Tests in `api/tests/test_media_upload.py` (Cloudinary mocked): `finalize` on `fake.jpg` returns 415 "Please choose a JPEG, PNG or WebP image" and deletes the temporary file; `too_big.jpg` returns 413 with `size_bytes` and `limit_bytes`; `tiny.png` as a photo succeeds with `warnings:["below_min_size"]` (photos 400×400, logos 200 px wide); `photo_ok.jpg` re-encodes without EXIF or GPS; PNG transparency is kept; alternative text that equals the file name fails the publish check
- [X] T018 [P] [US2] Vitest test in `web/components/admin/content/ImageField.test.tsx`: client-side type and size errors; a preview with the object URL in the same aspect frame as the public card; an alt-text counter and hint; a retry button after a failed upload keeps the other form values
- [X] T019 [US2] Implement `api/app/services/media_service.py`: `sign_upload(usage)` (Cloudinary signed params, folder `{CLOUDINARY_FOLDER}/tmp`, `allowed_formats=jpg,png,webp`) and `finalize(public_id, usage, alt_text)`. `finalize` downloads the temporary file, rejects over 5 MB, verifies the format with Pillow, checks dimensions, re-encodes without metadata (keeping alpha), uploads to `{CLOUDINARY_FOLDER}/{usage}`, deletes the temporary file, and stores the `media` row.
- [X] T020 [US2] Implement `api/app/routers/uploads.py`: `POST /api/v1/uploads/signature` and `POST /api/v1/uploads/finalize` (for photo and logo usage they require admin or editor; `cv` usage is added in 007), and `PATCH /api/v1/admin/media/{id}` for alternative text, per `contracts/content.openapi.yaml`
- [X] T021 [US2] Create `web/lib/images/cloudinary-loader.ts` (`f_auto,q_auto,w_{width}`) and set `images.loader`/`loaderFile` in `web/next.config.ts`; public images always pass `width`, `height` and `alt`
- [X] T022 [US2] Wire `web/components/admin/content/ImageField.tsx`: validate on the client, preview, then on save request a signature, upload directly to Cloudinary with `XMLHttpRequest` progress, call `finalize`, and show server errors and warnings in a live region

---

## Phase 5: User Story 3 – Client logos (P2)

**Goal**: Add, order and remove the client logos shown in the home strip.

**Independent Test**: A published logo appears in the strip; after moving it to the first position it shows first; a removed logo disappears.

- [X] T023 [P] [US3] Tests in `api/tests/test_client_logos.py`: the logo and its alternative text are required to publish; `website_url` must be a valid http(s) URL; reorder; delete purges the image; public shape
- [X] T024 [US3] Create the `client_logos` table in `api/app/models/content.py` (+ mixin): `name` varchar(100), `logo_id` FK → media "required, with alt text", `website_url` varchar(300) nullable. Add an Alembic migration and register it through the factory with the tag `client-logos`.
- [X] T025 [US3] Wire `web/components/admin/content/ClientLogosManager.tsx` (existing): dnd-kit `KeyboardSensor` plus "Move up" and "Move down" buttons, live-region announcements, and remove with confirmation "This can't be undone"
- [X] T026 [US3] Replace the mock in `web/components/home/ClientLogoMarquee.tsx` usage with `getPublishedClientLogos()` (tag `client-logos`); logos with a `website_url` link out in a new tab

---

## Phase 6: User Story 4 – Team members (P2)

**Goal**: Manage team members (shown on `/about` from feature 006).

**Independent Test**: A published member appears from `GET /api/v1/public/team-members` in the set order; a bio over 300 characters is refused.

- [X] T027 [P] [US4] Tests in `api/tests/test_team_members.py`: name and role ≤ 100 characters; bio required and ≤ 300; photo with alternative text required to publish; reorder; public shape `PublicTeamMember`
- [X] T028 [US4] Create the `team_members` table in `api/app/models/content.py` (+ mixin): `name` varchar(100), `role` varchar(100), `bio` varchar(300), `photo_id` FK → media. Add an Alembic migration and register it through the factory with the tag `team-members`.
- [X] T029 [US4] Wire `web/app/admin/content/team/page.tsx`, `new/page.tsx` and `[id]/page.tsx` to the API, with a bio character counter

---

## Phase 7: User Story 5 – Find and track content (P3)

**Goal**: Lists with status, thumbnail and last changed by/when, filterable by status.

**Independent Test**: Each content list shows those columns and filters by Draft or Published.

- [X] T030 [P] [US5] Test in `api/tests/test_content_lists.py`: the list response includes `thumbnail_url`, `status`, `updated_by_name` and `updated_at`; the `status` filter works; soft-deleted items are excluded
- [X] T031 [US5] Add `updated_by_name` and `thumbnail_url` to the factory list response in `api/app/routers/content_factory.py`
- [X] T032 [US5] Update `web/components/admin/content/ContentTables.tsx` and `PublishBadge.tsx` to show the columns and a status filter (held in URL search params)

---

## Phase 8: Polish

- [X] T033 [P] Implement `cleanup_media()` in `api/app/jobs/content_jobs.py`, deleting unreferenced `media` older than 24 hours and Cloudinary `tmp/` files older than 24 hours, to be called by the daily cron (created in 010; DEPLOYMENT D5), and runnable manually
- [X] T034 [P] Accessibility check of the admin content forms, reordering and uploads with axe in `web/e2e/content-a11y.spec.ts`
- [X] T035 (Done for testimonials, logos and team; posts, FAQs and roles stay mock until 006/007.) Delete the mock content modules (`web/lib/data/content.ts` and the `ContentProvider` mock state) once all screens use the API
- [ ] T036 Run quickstart scenarios 1–12 on the Vercel Hobby previews, including scenario 11 (a failing webhook still meets the 5-minute bound through `revalidate: 300`)

## Dependencies

- **Order**: Setup → Foundational (T003–T009) → US1 and US2 (US1 needs US2 only for photos; build the image field first if photos are wanted in the MVP) → US3 and US4 in parallel → US5 → Polish.
- **Downstream**: 005 and 007 depend on Phase 2 and US2.

## Parallel examples

- T009 alongside T006–T008 once T003 exists.
- US3 (T023–T026) and US4 (T027–T029) in parallel.

## Implementation strategy

**MVP**: Phase 2 + US1 + US2. Then US3, US4 and US5.
