# Data Model: Blog, Industry Pages, Newsletter, FAQ, Careers and Theme

Reuses `PublishableMixin`, `media` and `content_activity` (004), `team_members` (004), `faqs` (006), `case_studies` (005) and the `lead_service` / `case_study_industry` enums.

## `posts` (+ PublishableMixin)

| Column | Type | Required to publish |
|--------|------|--------------------|
| `slug` | varchar(100), unique | ✔ |
| `title` | varchar(120) | ✔ |
| `excerpt` | varchar(200) | ✔ |
| `body_md` | text | ✔, ≥ 300 words; every `![alt](…)` has non-empty alt |
| `cover_id` | UUID FK → media | ✔, with alternative text |
| `category` | enum `post_category` (`social_media`, `seo`, `web_software`, `ui_ux_design`, `meta_ads`, `agency_news`) | ✔ |
| `author_id` | UUID FK → team_members | ✔ |
| `reading_minutes` | smallint | Computed on save |
| `word_count` | integer | Computed on save |
| `seo_title` | varchar(60), nullable | Defaults to the title |
| `seo_description` | varchar(160), nullable | Defaults to the excerpt |
| `content_updated_at` | timestamptz, nullable | Set when a published post's body or title changes (shown as "last updated") |

`published_at` (mixin) is set on the first publish only (FR-011).

## `tags` / `post_tags`

`tags`: `id`, `name` varchar(40), `slug` varchar(50) unique (normalised).

`post_tags`: (`post_id`, `tag_id`) PK. At most 8 per post.

## `post_slug_history`

`old_slug` PK, `post_id` FK, `created_at` (as in 005).

## `industry_pages` (+ PublishableMixin)

| Column | Type | Required to publish |
|--------|------|--------------------|
| `slug` | varchar(100), unique | ✔ (industry + city) |
| `industry_name` | varchar(60) | ✔ |
| `city` | varchar(60) | ✔ |
| `country` | `lead_country` | ✔ |
| `headline` | varchar(120) | ✔ |
| `intro_md`, `challenges_md` | text | ✔ |
| `services` | `lead_service[]` | ✔, ≥ 1 |
| `case_study_industries` | `case_study_industry[]` | Optional |
| `share_image_id` | UUID FK → media, nullable | Falls back to a generated image |
| `seo_title`, `seo_description` | varchar(60) / varchar(160) | ✔ |

`industry_page_case_studies`: (`industry_page_id`, `case_study_id`, `sort_order`), at most 6. If present, overrides `case_study_industries`.

## `subscribers`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `email` | varchar(254) | Unique on lower(email) |
| `status` | enum (`pending`, `confirmed`, `unsubscribed`) | |
| `confirm_token_hash` | char(64), nullable | Cleared on confirm |
| `confirm_token_expires_at` | timestamptz, nullable | +7 days |
| `unsubscribe_token_hash` | char(64) | Permanent per subscriber |
| `source_page` | varchar(200) | |
| `signed_up_at`, `confirmed_at`, `unsubscribed_at` | timestamptz | |
| `confirmation_emails_sent_24h` | derived | From `email_deliveries` rows of kind `newsletter_confirmation` (at most 3 per 24 h) |

**Transitions**: `pending → confirmed → unsubscribed → pending (re-subscribe)`. `pending` rows older than 30 days are deleted. Access: admin only.

## `job_roles` (+ PublishableMixin; `status` extended with `closed`)

| Column | Type | Required to publish |
|--------|------|--------------------|
| `slug` | varchar(100), unique | ✔ |
| `title` | varchar(100) | ✔ |
| `employment_type` | enum (`full_time`, `part_time`, `internship`) | ✔ |
| `work_arrangement` | enum (`onsite_karachi`, `hybrid`, `remote`) | ✔ |
| `description_md`, `responsibilities_md`, `requirements_md`, `offer_md` | text | ✔ |
| `closing_date` | date, nullable | |

**Open** = `status = published AND (closing_date IS NULL OR closing_date >= today PKT)`.

## `job_applications`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `role_id` | UUID FK → job_roles | |
| `name` | varchar(100) | Required |
| `email` | varchar(254) | Required; unique with `role_id` (lower) |
| `phone` | varchar(20) | Required |
| `cv_provider_id` | varchar(255) | Cloudinary authenticated raw id; never a public URL |
| `cv_size_bytes` | integer | ≤ 5 MB |
| `cover_note` | varchar(1500), nullable | |
| `portfolio_url` | varchar(300), nullable | Valid http(s) |
| `status` | enum (`new`, `reviewed`, `shortlisted`, `rejected`) | Default `new` |
| `created_at` | timestamptz | |

Access: admin only (feature 003). Deletion removes the CV file.

## Theme preference

Not stored server-side. It is kept in `localStorage` (`theme`) by next-themes.
