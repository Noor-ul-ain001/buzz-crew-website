# Data Model: Case Studies

Reuses `PublishableMixin`, `media` and `content_activity` from feature 004 and the `lead_country` / `lead_service` enums from feature 001.

## Enums

| Enum | Values |
|------|--------|
| `case_study_industry` | `food_beverages`, `farmhouses`, `healthcare_dental`, `education`, `ecommerce`, `other` |
| `case_study_media_kind` | `image`, `reel` |

## `case_studies` (+ PublishableMixin)

| Column | Type | Required to publish |
|--------|------|--------------------|
| `slug` | varchar(80), unique | ✔; lowercase hyphenated |
| `client_name` | varchar(100) | ✔ (as shown publicly) |
| `title` | varchar(120) | ✔ |
| `summary` | varchar(200) | ✔ (cards, meta description, share text) |
| `industry` | `case_study_industry` | ✔ |
| `country` | `lead_country` | ✔ |
| `services` | `lead_service[]` | ✔, ≥ 1 |
| `challenge_md`, `strategy_md`, `execution_md` | text (≤ 10,000 each) | ✔ |
| `project_period` | varchar(40), nullable | Optional (for example, "Jan–Jun 2026") |
| `cover_id` | UUID FK → media | ✔, with alternative text |
| `before_image_id`, `after_image_id` | UUID FK → media, nullable | Both or neither; alternative text required |
| `before_label`, `after_label` | varchar(30) | Default "Before" / "After" |
| `testimonial_id` | UUID FK → testimonials, nullable | Shown publicly only if that testimonial is published and not deleted |
| `seo_title` | varchar(60), nullable | Falls back to the title |
| `seo_description` | varchar(160), nullable | Falls back to the summary |

**Indexes**: unique `slug`; `(status, deleted_at, sort_order)`; GIN on `services`; `industry`.

## `case_study_results`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `case_study_id` | UUID FK ON DELETE CASCADE | |
| `value` | varchar(30) | For example "+240%" or "3.1x" |
| `label` | varchar(80) | What was measured |
| `period` | varchar(40) | For example "in 3 months" |
| `starting_value` | varchar(30), nullable | |
| `is_headline` | boolean | At most 3 per case study |
| `sort_order` | integer | |

**Constraint (publish time)**: 1 ≤ count ≤ 6.

## `case_study_media`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `case_study_id` | UUID FK ON DELETE CASCADE | |
| `kind` | `case_study_media_kind` | Images ≤ 20, reels ≤ 5 per case study |
| `media_id` | UUID FK → media | The image, or the reel's preview image |
| `video_url` | varchar(300), nullable | Required when `kind = reel`; host allowlist |
| `description` | varchar(200), nullable | Required to publish when `kind = reel` |
| `sort_order` | integer | |

## `case_study_slug_history`

| Column | Type | Rules |
|--------|------|-------|
| `old_slug` | varchar(80) PK | Unique across current and historical slugs |
| `case_study_id` | UUID FK | |
| `created_at` | timestamptz | |

## Relationships

`case_studies 1─* case_study_results`, `1─* case_study_media`, `1─* case_study_slug_history`, `*─1 testimonials` (optional), `*─1 media` (cover, before, after).

## State

As in feature 004: `draft ⇄ published`, soft delete. Unpublishing or deleting also removes the item from sitemap, facets and related lists through the `case-studies` tag revalidation.
