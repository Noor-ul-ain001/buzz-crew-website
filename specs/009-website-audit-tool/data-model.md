# Data Model: Free Website Audit Tool

## `audits`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `entered_url` | varchar(500) | As typed (normalised) |
| `final_url` | varchar(500), nullable | After redirects |
| `site_key` | char(64) | sha256(host + path) for the per-site limit and reuse |
| `status` | enum (`queued`, `running`, `completed`, `failed`) | |
| `step` | enum (`fetching`, `checking_seo`, `measuring_speed`, `explaining`), nullable | Progress |
| `failure_reason` | enum (`invalid_url`, `blocked_address`, `unreachable`, `timeout`, `http_error`, `blocked_by_site`, `not_html`, `too_many_redirects`, `measurement_failed`), nullable | |
| `visitor_key_hash`, `ip_hash` | char(64) | |
| `reused_from_id` | UUID, nullable | When served from the per-site cache |
| `started_at`, `finished_at` | timestamptz | |

A failed audit never has a report (FR-005).

## `audit_reports` (only for completed audits)

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `audit_id` | UUID FK unique | |
| `token` | char(43) unique | Private link |
| `performance_score`, `seo_score` | smallint 0–100 | |
| `checks` | jsonb | Array of `CheckResult` (below) |
| `top_issues` | jsonb | ≤ 5 check ids ordered by impact |
| `explanation` | jsonb | Rendered fixes (placeholders substituted) |
| `explanation_source` | enum (`ai`, `fallback`) | |
| `lead_id` | UUID FK → leads, nullable | |
| `delete_after` | timestamptz, nullable | created + 90 days while `lead_id` is null |
| `created_at` | timestamptz | |

### `CheckResult` (JSON)

| Field | Example |
|-------|---------|
| `id` | `title`, `meta_description`, `headings`, `image_alt`, `mobile`, `speed` |
| `status` | `passed`, `needs_work`, `failed`, `not_applicable` |
| `summary` | One plain-language sentence |
| `measured` | `{ "title_text": "Home", "title_length": 4 }`, `{ "h1_count": 0, "skipped_levels": ["h2→h4"] }`, `{ "images_total": 12, "images_missing_alt": 5 }`, `{ "lcp_s": 4.1, "inp_ms": 310, "cls": 0.02 }` |
| `detail` | Emailed or full-report only: affected items (for example up to 20 image file names, heading outline), how to fix |

Only these extracted fields are stored, not the page HTML (FR-023).

## Leads (from 001)

`source = website_audit`; linked through `audit_reports.lead_id` (one lead may have several reports).

## Usage limits

`visitor_usage` kinds (from 008): `audit_visitor` (3 per day). The per-site hourly count is derived from `audits` by `site_key` and `started_at`.
