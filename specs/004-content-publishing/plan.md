# Implementation Plan: Content Management and Publishing

**Branch**: `004-content-publishing` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-content-publishing/spec.md`

## Summary

This feature establishes the reusable publishing pattern that case studies (005) and blog posts (007) will also use.

- **Content tables**: testimonials, client logos and team members share a `PublishableMixin` (status, sort order, publishing timestamps, version, soft delete) and write to a `content_activity` log.
- **Images**: uploaded directly from the browser to Cloudinary with a short-lived signature (`POST /api/v1/uploads/signature`), then checked by FastAPI (`POST /api/v1/uploads/finalize`), because Vercel caps request bodies at 4.5 MB (DEPLOYMENT D6). The API verifies the real file type from its content with Pillow, enforces the 5 MB limit and the dimension warnings, and re-encodes the image to strip EXIF and GPS data. It then uploads to Cloudinary, which serves resized, responsive variants.
- **Endpoints**: admin CRUD under `/api/v1/admin/content/*` (admin or editor). Public read-only endpoints under `/api/v1/public/*` return published, non-deleted items only.
- **Updates on the site**: after every publish, unpublish, edit, reorder or delete, the API calls a signed Next.js revalidation route that expires the affected cache tags immediately. Public fetches also carry a 300 s revalidate safety net, so the spec's 5-minute bound holds even if the webhook fails.
- **Admin screens**: the existing admin content prototypes (list, drag-to-reorder with `@dnd-kit` plus Move up/down buttons, and forms with a client-side image preview) are wired to the generated API client.

## Technical Context

**Language/Version**: TypeScript 5 strict / Next.js 16.3; Python 3.12+

**Primary Dependencies**:
- **api**: FastAPI, SQLModel, Alembic, `Pillow`, `cloudinary` (Python SDK: signed uploads, download for verification)
- **web**: `@dnd-kit/core` and `@dnd-kit/sortable` (already installed), React Hook Form + Zod, `next/image` with a Cloudinary loader

**Storage**: Neon Postgres (`media`, `testimonials`, `client_logos`, `team_members`, `content_activity`); Cloudinary for image files.

**Testing**: pytest covers:
- the publish rules (missing alternative text, missing required fields);
- file type sniffing, oversize and wrong-type rejection;
- EXIF removal;
- soft-deleted and draft items being invisible to public endpoints;
- optimistic-lock conflicts, reorder, and the role checks (anonymous gets 401);
- revalidation webhook calls (mocked).

Vitest covers the ImageField component (type and size errors, preview, alt-text rules). Playwright covers publishing a testimonial and seeing it on the home page.

**Target Platform**: Vercel Hobby (free) for both the `web` and `api` projects (practice project) — see [DEPLOYMENT.md](../DEPLOYMENT.md) and [COSTS.md](../COSTS.md)

**Project Type**: Web application (`web/` + `api/`)

**Performance Goals**: Public content endpoints p95 < 100 ms; published changes visible within 5 minutes (normally within seconds). Images are delivered as AVIF or WebP at responsive widths, with no CLS thanks to stored width and height.

**Constraints**:
- Upload limits: JPEG, PNG or WebP only, 5 MB; minimum size 400×400 for photos and 200 px wide for logos (warning only).
- Alternative text: 5–150 characters, and not the file name.
- Text limits: quote 20–400, bio up to 300, names up to 100.
- WCAG 2.1 AA admin forms, with a non-drag way to reorder.

**Scale/Scope**: Tens of items per content type; 3 content types now, with the pattern reused by 005 and 007.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-driven | Spec has no open markers; depends on 003 (planned) | ✅ Pass |
| II. SEO & performance | Public sections stay Server Components with cached, tagged fetches; `next/image` with explicit dimensions and alternative text | ✅ Pass |
| III. Contract-first | [contracts/content.openapi.yaml](./contracts/content.openapi.yaml) defines admin, public and media endpoints; web types are generated | ✅ Pass |
| IV. Test-first | Publish-rule, upload and visibility tests are written first | ✅ Pass |
| V. Security & privacy | Writes require admin or editor via 003's `require_role`; uploads are sniffed and re-encoded, and GPS/EXIF data is removed; no SVG | ✅ Pass |
| VI. Type safety | Pydantic per content type; Zod in forms; generated types | ✅ Pass |
| VII. Accessible | Keyboard reorder (dnd-kit KeyboardSensor plus Move buttons), labelled uploads, live-region error messages, unsaved-changes guard | ✅ Pass |
| VIII. Simplicity | Cloudinary is a managed service the constitution lists; one shared mixin; no media library; no queue (webhook plus revalidate safety net) | ✅ Pass |
| IX. AI | N/A | N/A |
| X. Observability | `content_activity` records who did what and when; webhook failures are logged | ✅ Pass |
| Data conventions | Plural tables, id and timestamps, `deleted_at` soft delete, enum status | ✅ Pass. The spec's "permanent deletion" is met by soft delete, which hides the item from the admin area and the public site, together with image purge; see research R6. |

**Post-design re-check**: Pass.

## Project Structure

### Documentation (this feature)

```text
specs/004-content-publishing/
├── plan.md  research.md  data-model.md  quickstart.md
└── contracts/content.openapi.yaml
```

### Source Code

```text
api/app/
├── models/publishable.py         # PublishableMixin, PublishStatus enum, ContentActivity
├── models/media.py               # Media
├── models/content.py             # Testimonial, ClientLogo, TeamMember + Create/Update/Public schemas
├── services/media_service.py      # sniff, validate, re-encode (strip EXIF), Cloudinary upload/delete
├── services/publishing.py         # publish/unpublish/delete/reorder rules, version check, activity log
├── services/revalidation.py       # signed POST to web /api/revalidate with tags
├── routers/uploads.py             # POST /api/v1/uploads/signature, POST /api/v1/uploads/finalize (D6)
├── routers/admin_content.py       # CRUD + publish/unpublish/reorder for the 3 types (generic factory)
├── routers/public_content.py      # GET /api/v1/public/{testimonials,client-logos,team-members}
└── jobs/cleanup_media.py          # daily: delete unreferenced media older than 24 h
api/tests/test_media_upload.py  test_publish_rules.py  test_public_visibility.py  test_reorder.py  test_concurrency.py

web/
├── app/api/revalidate/route.ts    # verifies HMAC; revalidateTag(tag, { expire: 0 })
├── lib/content/public.ts          # server fetchers with next.tags + revalidate 300
├── lib/images/cloudinary-loader.ts
├── components/admin/content/*     # existing prototypes wired to the API (ImageField, SortableList, PublishBar)
└── app/admin/content/{testimonials,logos,team}/...   # existing pages
```

**Structure Decision**: This extends `web/` + `api/`. `PublishableMixin`, `publishing.py` and the router factory are the reusable pattern that features 005 and 007 import.

## Complexity Tracking

No violations.
