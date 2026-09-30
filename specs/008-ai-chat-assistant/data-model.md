# Data Model: AI Chat Assistant

## `knowledge_chunks` (retrieval index; rebuilt from published content)

| Column | Type | Rules |
|--------|------|-------|
| `id` | bigint PK | |
| `source_type` | enum (`service`, `process`, `pricing`, `faq`, `case_study`, `industry_page`, `knowledge_entry`) | |
| `source_id` | varchar(100) | For example a service slug or a content UUID |
| `source_key` | varchar(120) | `{source_type}:{source_id}`; cited in answer markers |
| `url` | varchar(300) | Public URL shown as a link |
| `title` | varchar(200) | |
| `content` | text | ≤ ~400 tokens; published content only |
| `is_core` | boolean | Part of the always-included core facts block |
| `tsv` | tsvector | Generated: weight A = title, weight D = content (`english` configuration); GIN index |
| `source_updated_at` | timestamptz | For freshness checks |

Rebuilt per source on publish, unpublish or edit (same transaction), and fully by the reindex job every 10 minutes. Unpublished or deleted sources have no chunks.

## `chat_conversations`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `visitor_key_hash` | char(64) | sha256(device id), or the IP hash fallback |
| `ip_hash` | char(64) | |
| `start_page` | varchar(200) | Path only |
| `pages` | varchar(200)[] | Paths visited while chatting (max 20) |
| `message_count` | smallint | Visitor messages |
| `handoff` | enum (`none`, `inquiry`, `whatsapp`) | Default `none` |
| `handoff_summary` | varchar(600), nullable | AI-generated (labelled) or the fallback question list |
| `handoff_services` | `lead_service[]` | |
| `lead_id` | UUID FK → leads, nullable | Set when the inquiry is submitted |
| `is_test` | boolean | Admin "Test the assistant"; excluded from statistics and limits |
| `model` | varchar(60) | Groq model id used for answers (for example `openai/gpt-oss-120b`) |
| `created_at`, `last_message_at` | timestamptz | |
| `delete_after` | timestamptz, nullable | created + 30 days when `lead_id IS NULL`; null when linked to a lead (lead retention applies) |

## `chat_messages`

| Column | Type | Rules |
|--------|------|-------|
| `id` | bigint PK | |
| `conversation_id` | UUID FK ON DELETE CASCADE | |
| `role` | enum (`visitor`, `assistant`) | |
| `content` | text | Masked (cards, IBAN, CNIC, Emirates ID → `[removed]`); visitor ≤ 500 characters |
| `retrieved_keys` | varchar[] | Assistant only; chunk `source_key`s given as context (for the evaluation hit rate) |
| `source_ids` | varchar[] | Assistant only; cited and resolved to published URLs at answer time |
| `declined` | boolean | Assistant only |
| `outcome` | enum (`ok`, `price_guard_replaced`, `refused`, `timeout`, `error`) | Assistant only |
| `rating` | enum (`helpful`, `not_helpful`), nullable | FR-007 |
| `input_tokens`, `output_tokens`, `cached_tokens` | integer | Assistant only |
| `created_at` | timestamptz | |

## `assistant_knowledge_entries` (+ PublishableMixin from 004)

| Column | Type | Rules |
|--------|------|-------|
| `title` | varchar(120) | Required |
| `answer` | varchar(1000) | Required; plain text |

Admin only (not editors).

## `assistant_settings` (single row)

| Column | Type | Default |
|--------|------|---------|
| `welcome_message` | varchar(300) | "Hi! I'm the Buzz Crew AI assistant…" |
| `suggested_questions` | varchar(120)[3] | 3 prompts |
| `daily_message_limit` | smallint | 20 |
| `daily_cost_cap_usd` | numeric(8,2) | Set by admin |
| `updated_by`, `updated_at` | | |

## `ai_usage_daily` (shared with feature 010)

| Column | Type | Rules |
|--------|------|-------|
| `day` | date (PKT) | PK with `feature` |
| `feature` | enum (`chat`, `chat_summary`, `lead_priority`, `proposal`, `captions`) | |
| `requests` | integer | |
| `input_tokens`, `output_tokens`, `cached_tokens` | bigint | `cached_tokens` from Groq usage where reported (charged at 50%) |
| `estimated_cost_usd` | numeric(10,4) | From the configured Groq price table |
| `cap_notified_at` | timestamptz, nullable | One email per day |

## `visitor_usage` (limits)

| Column | Type | Rules |
|--------|------|-------|
| `key_hash` | char(64) | Visitor or IP hash |
| `kind` | enum (`chat_visitor`, `chat_ip`, `captions_visitor`) | |
| `day` | date (PKT) | |
| `count` | integer | PK (`key_hash`, `kind`, `day`) |

## `leads` (from 001)

New optional input `chat_conversation_id`; `source` value `chat_assistant`.
