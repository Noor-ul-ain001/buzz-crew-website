# Data Model: Service Pages, Team Page and Discovery Call Booking

## Service (repo content, not a table)

`web/content/services/types.ts`:

| Field | Type | Rules |
|-------|------|-------|
| `slug` | `"social-media" \| "seo" \| "web-software" \| "ui-ux-design" \| "meta-ads"` | Maps 1:1 to the `lead_service` enum |
| `name`, `headline`, `summary`, `outcome` | string | Summary 1–2 sentences (overview page) |
| `audience` | string[] | ≥ 2 |
| `deliverables` | string[] | ≥ 3 |
| `process` | `{ discovery, strategy, execution, reporting }` → string | Each describes that step for this service |
| `seo` | `{ title: string; description: string }` | Unique; description 70–160 characters |
| `relatedServices` | slug[] | Defaults to the other four |

## `faqs` (+ PublishableMixin from 004)

| Column | Type | Rules |
|--------|------|-------|
| `question` | varchar(200) | Required |
| `answer_md` | text (≤ 2,000) | Required; limited Markdown (links, lists, bold) |
| `topic` | enum `faq_topic` (`working_with_us`, `pricing_approach`, `timelines`, `process`, `services`) | Required |
| `services` | `lead_service[]` | 0..5; used by service pages |
| `industries` | varchar[] | Industry-page slugs (feature 007); 0..n |

Public visibility is as in 004. `sort_order` orders FAQs within a topic and on service pages.

## `discovery_calls`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `cal_booking_uid` | varchar(100), unique | Idempotency key for webhooks |
| `lead_id` | UUID FK → leads | Created or linked |
| `status` | enum `call_status` (`booked`, `rescheduled`, `cancelled`) | |
| `starts_at`, `ends_at` | timestamptz | UTC |
| `attendee_timezone` | varchar(64) | IANA name, for example `Europe/London` |
| `attendee_name` | varchar(100) | |
| `attendee_email` | varchar(254) | lower-cased |
| `attendee_phone` | varchar(20), nullable | |
| `business` | varchar(150), nullable | |
| `country` | `lead_country` | |
| `notes` | text | What they want to discuss (≥ 10 characters) |
| `source_page` | varchar(200) | From embed metadata |
| `created_at`, `updated_at` | timestamptz | |

**Transitions**: `booked → rescheduled → rescheduled …`; `booked|rescheduled → cancelled`.

**Rule**: At most 2 rows with `status IN (booked, rescheduled)` and `starts_at > now()` per `attendee_email`.

**Access**: admin only (same as leads, feature 003).

## `leads` (from 001)

New `source` value in use: `discovery_call`. The lead's `email_deliveries` gain `email_kind` value `call_team_notification`.
