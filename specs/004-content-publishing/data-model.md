# Data Model: Content Management and Publishing

## Shared: `PublishableMixin` (applied to every content table here and in features 005 and 007)

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `status` | enum `publish_status` (`draft`, `published`) | Default `draft` |
| `sort_order` | integer | Default: end of list |
| `version` | integer | Starts at 1; incremented on each update (optimistic lock) |
| `published_at` | timestamptz, nullable | Set on the first publish; `last_published_at` is updated on each publish |
| `last_published_at` | timestamptz, nullable | |
| `created_by`, `updated_by` | UUID FK → users | |
| `created_at`, `updated_at` | timestamptz | |
| `deleted_at` | timestamptz, nullable | Soft delete: hidden from the admin area and public endpoints |

**Public visibility rule** (all public queries): `status = 'published' AND deleted_at IS NULL`.

**States**: `draft → published` (only if `can_publish`), `published → draft` (unpublish), any → deleted (soft). Editing a published item keeps it `published` only if `can_publish` passes.

## `media`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `provider_public_id` | varchar(255) | Cloudinary public id |
| `url` | varchar(500) | Base delivery URL |
| `alt_text` | varchar(150), nullable | Required (5–150 characters, ≠ file name) before the owning item can publish |
| `original_filename` | varchar(255) | Used only for the "alt ≠ file name" check |
| `mime_type` | enum (`image/jpeg`, `image/png`, `image/webp`) | Sniffed from content |
| `width`, `height` | integer | After re-encoding |
| `size_bytes` | integer | ≤ 5,242,880 |
| `uploaded_by` | UUID FK → users | |
| `created_at` | timestamptz | Unreferenced for 24 h → deleted by cleanup |

## `testimonials` (+ PublishableMixin)

| Column | Type | Required to publish |
|--------|------|--------------------|
| `name` | varchar(100) | ✔ |
| `role` | varchar(100) | ✔ |
| `company` | varchar(100) | ✔ |
| `country` | enum `lead_country` (from 001) | ✔ |
| `quote` | varchar(400) | ✔, 20–400 characters |
| `photo_id` | UUID FK → media, nullable | Optional; alternative text required if present |
| `video_url` | varchar(300), nullable | Optional; host ∈ {youtube.com, youtu.be, vimeo.com, instagram.com} |

## `client_logos` (+ PublishableMixin)

| Column | Type | Required to publish |
|--------|------|--------------------|
| `name` | varchar(100) | ✔ |
| `logo_id` | UUID FK → media | ✔, with alternative text |
| `website_url` | varchar(300), nullable | Optional; valid http(s) URL |

## `team_members` (+ PublishableMixin)

| Column | Type | Required to publish |
|--------|------|--------------------|
| `name` | varchar(100) | ✔ |
| `role` | varchar(100) | ✔ |
| `bio` | varchar(300) | ✔ |
| `photo_id` | UUID FK → media | ✔, with alternative text |

## `content_activity`

| Column | Type | Rules |
|--------|------|-------|
| `id` | bigint PK | |
| `content_type` | varchar(40) | `testimonial`, `client_logo`, `team_member` (later: `case_study`, `post`, …) |
| `content_id` | UUID | |
| `action` | enum (`created`, `updated`, `published`, `unpublished`, `reordered`, `deleted`) | |
| `actor_id` | UUID FK → users | |
| `created_at` | timestamptz | |

Used for FR-009 and the list's "last changed by / when" (FR-024).
