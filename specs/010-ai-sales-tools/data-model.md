# Data Model: AI Lead Priority, Proposal Drafts, Caption Generator and Cost Estimator

## `lead_ai_insights`

| Column | Type | Rules |
|--------|------|-------|
| `lead_id` | UUID PK/FK → leads ON DELETE CASCADE | One current suggestion per lead |
| `status` | enum (`pending`, `done`, `failed`) | |
| `priority` | enum (`hot`, `warm`, `cold`), nullable | Set when `done` |
| `reason` | varchar(120), nullable | |
| `model` | varchar(60) | Groq model id, for example `openai/gpt-oss-20b` |
| `attempts` | smallint | |
| `next_attempt_at` | timestamptz, nullable | Retries until created + 24 h |
| `generated_at` | timestamptz, nullable | |

## `leads` (additions)

| Column | Type | Rules |
|--------|------|-------|
| `admin_priority` | enum (`hot`, `warm`, `cold`), nullable | Takes precedence over the suggestion for display, sorting and filtering; never changes `status` |
| `admin_priority_set_by` | UUID FK → users, nullable | |
| `admin_priority_set_at` | timestamptz, nullable | |
| `estimate` | jsonb, nullable | Snapshot when `source = cost_estimator`: `{selections:[{service, scope, min, max, billing}], monthly:{min,max}, one_off:{min,max}, calculated_at}` |

**Effective priority** = `coalesce(admin_priority, lead_ai_insights.priority)`.

## `proposals`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `lead_id` | UUID FK → leads ON DELETE CASCADE | Many per lead; never overwritten |
| `status` | enum (`draft`, `approved`) | |
| `origin` | enum (`ai`, `template`) | Template = manual fallback |
| `body_md` | text | Editable while `draft` |
| `version` | integer | Optimistic lock |
| `price_snapshot` | jsonb | Ranges used at generation time; kept after approval |
| `case_study_ids` | UUID[] | For stale-reference flags |
| `created_by`, `updated_by` | UUID FK → users | |
| `approved_by` | UUID FK → users, nullable | |
| `approved_at` | timestamptz, nullable | |
| `created_at`, `updated_at` | timestamptz | |

**Transitions**: `draft → approved` only if `body_md` contains no `[[` placeholder and the admin confirms review. `approved` is immutable; edits start a new `draft` copy. Export is allowed only when `approved`.

## `service_billing`

`service` (`lead_service`, PK), `billing_type` (enum `monthly`, `one_off`).

## `price_ranges`

| Column | Type | Rules |
|--------|------|-------|
| `service` | `lead_service` | PK with `scope` |
| `scope` | enum (`starter`, `growth`, `premium`) | |
| `min_pkr`, `max_pkr` | integer, nullable | Both null means "price on request"; otherwise 0 ≤ min ≤ max |
| `includes` | varchar(300) | What the scope includes |
| `updated_by`, `updated_at` | | |

## `pricing_changes`

`id`, `service`, `scope` (nullable for billing-type changes), `field` (`min_pkr`, `max_pkr`, `includes`, `billing_type`), `old_value`, `new_value`, `actor_id`, `created_at`. Append-only; admins can view it.

## `visitor_usage` (from 008): new kinds

`captions_visitor` (5 per day, counting successes and declines), `estimate_visitor` (100 per day).

## `ai_usage_daily` (from 008): features used

`lead_priority`, `proposal`, `captions`.

## Caption requests

These are not stored beyond usage counts and anonymous events (FR-028 and the spec's Key Entities).
