# Data Model: Project Inquiry Flow

All tables use UTC timezone-aware timestamps and plural snake_case names (constitution: Data model conventions). Enums are Postgres enum types created by Alembic.

## Enums

| Enum | Values |
|------|--------|
| `lead_country` | `pakistan`, `uae`, `uk`, `other` |
| `lead_service` | `social_media`, `seo`, `web_software`, `ui_ux_design`, `meta_ads` |
| `lead_budget_range` | `under_50k`, `50k_150k`, `150k_plus`, `not_sure` |
| `lead_status` | `new`, `contacted`, `proposal_sent`, `won`, `lost` |
| `email_kind` | `team_notification`, `client_confirmation` |
| `email_status` | `sent`, `failed` |

## Table `leads`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID, PK | Generated server-side |
| `name` | varchar(100) | Required; trimmed; 1–100 characters |
| `email` | varchar(254) | Required; valid email; stored lower-cased |
| `phone` | varchar(20), nullable | Optional; `^\+?[\d\s()-]{7,20}$` |
| `business` | varchar(150), nullable | Optional; trimmed |
| `country` | `lead_country` | Required |
| `services` | `lead_service[]` | Required; ≥ 1; no duplicates |
| `budget_range` | `lead_budget_range` | Required |
| `message` | text | Required; trimmed; 10–2,000 characters; stored as plain text |
| `status` | `lead_status` | Default `new`; only `new` is set by this feature |
| `source` | varchar(40) | Default `contact_form`; later features add `chat_assistant`, `website_audit`, `cost_estimator`, `discovery_call` |
| `source_page` | varchar(200) | Path only, no query string |
| `idempotency_key` | UUID | Required; **unique index** |
| `post_process_token_hash` | char(64), nullable | sha256 of the one-time token returned in `LeadCreated`, used by feature 010's scoring call (DEPLOYMENT D4); valid for 10 minutes |
| `created_at` | timestamptz | Default now() |
| `updated_at` | timestamptz | Default now(); updated on change |
| `deleted_at` | timestamptz, nullable | Soft delete (constitution); hard delete is used for erasure requests (lead-management feature) |

**Indexes**: `ix_leads_created_at`, `ix_leads_status`, unique `ux_leads_idempotency_key`.

**State**: This feature only creates leads in `new`. Transitions belong to the lead-management feature.

## Table `email_deliveries`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID, PK | |
| `lead_id` | UUID, FK → `leads.id` ON DELETE CASCADE | |
| `kind` | `email_kind` | |
| `status` | `email_status` | |
| `provider_message_id` | varchar(100), nullable | Set when `sent` |
| `error_code` | varchar(60), nullable | Short machine code when `failed` (for example `provider_timeout`, `rejected_recipient`); never the email address |
| `attempted_at` | timestamptz | |

**Indexes**: `ix_email_deliveries_lead_id`.

Satisfies FR-015: whether each email was sent or failed, and when.

## Relationships

`leads 1 ── * email_deliveries` (normally exactly one row per kind per lead).

## Validation source of truth

The Pydantic `LeadCreate` schema (see [contracts/leads.openapi.yaml](./contracts/leads.openapi.yaml)) enforces all rules above. The web Zod schema mirrors them for inline errors only.
