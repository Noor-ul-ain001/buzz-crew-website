# Research: Content Management and Publishing

> **Hosting update (2026-09-28):** the project runs entirely on Vercel Hobby. The decisions in [DEPLOYMENT.md](../DEPLOYMENT.md) take precedence over this file where they conflict. They are D6 (direct signed uploads to Cloudinary plus API finalisation; replaces R2's multipart `POST /admin/media`; same validation and messages) and D5 (media cleanup in the daily cron).

## R1. Media storage provider

- **Decision**: Cloudinary. The backend uploads with the SDK into the `buzzcrew/{env}/{content_type}` folder. Delivery URLs use `f_auto,q_auto,w_<n>` with a custom `next/image` loader.
- **Rationale**: Cloudinary provides responsive resizing, AVIF/WebP and crop transformations (needed for the preview-matching crop) without building an image pipeline. It is listed in the constitution.
- **Alternatives considered**: Vercel Blob was rejected because it stores files without transformations, so resizing would need `next/image` optimisation quota or custom code. Storing on the API disk is forbidden by the constitution.

## R2. Upload validation and metadata stripping

- **Decision**: `POST /api/v1/admin/media` (multipart) runs these steps in order:
  1. Reject files over 5 MB while streaming (413 `file_too_large`, with size and limit).
  2. Open with Pillow and verify the format is JPEG, PNG or WebP from the content, not the name or extension (415 `unsupported_type`).
  3. Read the dimensions and return `warnings: ["below_min_size"]` below 400×400 (photos) or 200 px wide (logos).
  4. Re-encode without metadata, stripping EXIF and GPS (the spec edge case), and keeping transparency for PNG and WebP.
  5. Upload to Cloudinary and store a `media` row.
- **Rationale**: This meets FR-016–FR-018 and FR-021. Re-encoding also neutralises polyglot files.
- **Alternatives considered**: Direct signed browser uploads to Cloudinary were rejected: they are faster, but validation and EXIF stripping would then rely on provider settings rather than tested code.

## R3. Preview before saving

- **Decision**: The preview is client-side, using `URL.createObjectURL`. It is rendered in the same aspect-ratio frame and `object-fit: cover` crop as the public component. Client-side checks (type and size) run first, for instant errors. The upload happens when the editor saves; the media id is then attached to the item. Media that stays unreferenced after 24 hours is deleted by a daily cleanup job.
- **Rationale**: This meets FR-019 ("preview before anything is saved") and the rule that nothing is stored for rejected files.

## R4. Publish rules

- **Decision**: `services/publishing.py` implements `can_publish(item) -> list[FieldError]`:
  - required fields per type (FR-012, FR-014, FR-015);
  - every referenced media item has `alt_text` of 5–150 characters that does not equal the original file name, with or without its extension;
  - a video URL, if present, matches the YouTube, Vimeo or Instagram hosts.

  Publishing returns 422 with field errors. Saving an item that is already published runs the same checks (FR-005). A draft save skips them (FR-002).
- **Rationale**: One rule function, tested once and reused by 005 and 007.

## R5. How published changes reach the site within 5 minutes

- **Decision**:
  - **Tags**: public fetchers use `fetch(url, { next: { tags: ["testimonials"], revalidate: 300 } })`, with tags `testimonials`, `client-logos` and `team-members`.
  - **Webhook**: after each committed change, the API POSTs `{ tags: [...] }` to `WEB_URL/api/revalidate` with an HMAC-SHA256 signature header (shared `REVALIDATE_SECRET`). The route handler verifies the signature and calls `revalidateTag(tag, { expire: 0 })`, so the next request fetches fresh data and never serves an unpublished item.
  - **Failure**: the webhook has a 3 s timeout and one retry, and a failure is logged. The 300 s revalidate still guarantees the 5-minute bound.
- **Rationale**: This meets FR-007 and SC-002. `{ expire: 0 }` is used rather than `"max"` because unpublishing must not show stale content to even one visitor. `updateTag` only works in Server Actions, and this call comes from the API (Next.js 16 docs).
- **Alternatives considered**: Time-based revalidation only (300 s) was rejected because it is slower for every edit. Enabling `cacheComponents` with `"use cache"`/`cacheTag` was deferred: it changes rendering semantics site-wide and is not needed while all public data comes from fetch.

## R6. Deletion

- **Decision**: "Remove" sets `deleted_at` and hides the item from both the admin lists and the public endpoints, and immediately deletes its images from Cloudinary. The row remains for the activity trail. When a data subject requests erasure (for example, a team member's photo and bio), an admin-only hard-delete path removes the row and media entirely.
- **Rationale**: The spec requires removal from the website and the admin area. The constitution requires soft delete for business records except for erasure requests. This satisfies both.

## R7. Concurrent edits

- **Decision**: Each content row has an integer `version`. PATCH requests include `version`. If it doesn't match, the API returns 409 `version_conflict` with the current item. The admin form shows "Changed by {name} at {time}", with "Review changes" and "Overwrite" options.
- **Rationale**: This meets FR-010 without locks.

## R8. Ordering and accessibility

- **Decision**: Rows have an integer `sort_order`. `PUT /api/v1/admin/content/{type}/order` takes the full ordered list of ids in one transaction. New items get `max(sort_order)+1`, so they appear at the end. The UI uses the dnd-kit `KeyboardSensor` plus explicit "Move up" and "Move down" buttons, and announces moves in a live region.
- **Rationale**: This meets FR-011 and FR-025, and the concurrent-reorder edge case: ids not in the submitted list keep their relative order at the end.

## R9. Text safety

- **Decision**: All content fields are stored and rendered as plain text. React escapes output, and the API rejects nothing but treats input as text. Video URLs are validated against a host allowlist and rendered as links with `rel="noopener noreferrer"`.
- **Rationale**: This covers the markup and scripts edge case.
