---
description: "Task list for 008 AI Chat Assistant (Groq)"
---

# Tasks: AI Chat Assistant

**Input**: `specs/008-ai-chat-assistant/` (plan, spec, research, data-model, contracts/chat.openapi.yaml, quickstart), plus `specs/DEPLOYMENT.md` and `specs/COSTS.md`

**Prerequisites**: 001, 003, 004 (publishing hooks), 005, 006 (faqs, service content) and 007 are complete.

**Provider**: **Groq free tier** (`groq` SDK; `openai/gpt-oss-120b` for chat, `openai/gpt-oss-20b` for structured summaries). **No Anthropic or Claude API anywhere.** No paid plan without the owner's approval.

**Tests**: Included. All tests use a **fake Groq client**; real API calls happen only in the manual evaluation (T041).

---

## Phase 1: Setup

- [ ] T001 Create branch `008-ai-chat-assistant`; add `groq` and `sse-starlette` to `api/pyproject.toml`; add `GROQ_API_KEY`, `CHAT_MODEL=openai/gpt-oss-120b`, `STRUCTURED_MODEL=openai/gpt-oss-20b` and `AI_PRICE_TABLE_JSON` to `api/.env.example` (server only)
- [ ] T002 [P] Create `api/tests/fakes/groq.py`: `FakeGroq` supporting streamed deltas, a json_schema response, a 429 with `retry-after`, a 500, a timeout, empty content, and capture of the sent messages (so masking can be asserted)

---

## Phase 2: Foundational – the shared AI module (blocking; reused by 009 and 010)

- [ ] T003 Implement `api/app/ai/client.py`:
  - a Groq client factory (model ids from env);
  - `stream_chat(messages, *, timeout=20)`, which yields `choices[0].delta.content` only, with `reasoning_effort="low"`, `include_reasoning=False` and `max_completion_tokens=800`;
  - error mapping (429 → retry once if `retry-after` ≤ 2 s, otherwise `AIUnavailable`; 5xx, timeout, empty or refused → `AIUnavailable`);
  - recording of usage (`prompt_tokens`, `completion_tokens`, `cached_tokens` where present) into `ai_usage_daily`.
- [ ] T004 Implement `api/app/ai/structured.py` `generate(model, schema: type[BaseModel], messages, timeout)`: `response_format={"type":"json_schema","json_schema":{"name":…, "strict":True, "schema": model_json_schema with all fields required and additionalProperties false}}`, non-streaming, then `schema.model_validate_json`; raises `AIInvalidOutput` or `AIUnavailable`
- [ ] T005 Create the models in `api/app/models/ai_usage.py`, with an Alembic migration:
  - **`ai_usage_daily`**: PK (`day` PKT, `feature` enum `chat`,`chat_summary`,`lead_priority`,`proposal`,`captions`); `requests`; `input_tokens`, `output_tokens`, `cached_tokens` bigint; `estimated_cost_usd` numeric(10,4) "from the configured Groq price table"; `cap_notified_at`.
  - **`visitor_usage` is not created**: use 001's `rate_limit_hits` with kinds `chat_visitor` and `chat_ip` (DEPLOYMENT D3).
- [ ] T006 Implement `api/app/ai/guards.py`:
  - `mask_sensitive(text)`: card numbers (13–19 digits passing Luhn), IBANs, CNIC `\d{5}-?\d{7}-?\d` and Emirates ID `784-?\d{4}-?\d{7}-?\d` become `[removed]`;
  - `parse_markers(text)` for `<<sources: …>>` and `<<declined>>`;
  - `price_check(text, published_ranges)`: every PKR, Rs, AED, £ or $ amount (including k forms) must equal a range bound.
- [ ] T007 [P] Tests in `api/tests/test_guards.py` covering masking (including a Luhn-invalid 16-digit number kept as is), marker parsing (including split across stream chunks) and price-check pass and fail cases
- [ ] T008 [P] Tests in `api/tests/test_ai_client.py`: 429 with retry-after 1 s retries once; 429 with retry-after 30 s raises `AIUnavailable` with no wait; timeout; empty content; a structured-output validation failure raises `AIInvalidOutput`; usage is accumulated

**Checkpoint**: The shared AI module is ready (009 and 010 depend on it).

---

## Phase 3: User Story 1 – Ask and get a grounded answer (P1) 🎯 MVP

**Goal**: A streamed, concise answer from approved content only, with up to 3 links.

**Independent Test**: Against seeded content, "Do you do SEO for dental clinics in Dubai?" streams an answer whose links come only from published pages; drafts never appear; the conversation survives page navigation.

### Tests

- [ ] T009 [P] [US1] Tests in `api/tests/test_knowledge.py`: chunk building per source type, published only; a draft FAQ and an unpublished case study produce no chunks; the core facts block contains the 5 services with URLs and all published price ranges; unpublishing removes the chunks in the same transaction
- [ ] T010 [P] [US1] Tests in `api/tests/test_retrieval.py`: `websearch_to_tsquery` plus synonym expansion ("boost my instagram" → Social Media and Meta Ads chunks; "dentist" → Healthcare & Dental case study); top 6 within a 2,500-token budget; the prompt order is system (instructions + core facts), then context, then messages (the prefix is stable across requests)
- [ ] T011 [P] [US1] Tests in `api/tests/test_chat_stream.py` (FakeGroq): the SSE sequence `meta` → `delta`* → `done{links≤3, declined, remaining_today, message_id}`; markers are stripped from the deltas; unknown or unpublished source keys are dropped; messages are stored masked; `retrieved_keys` is recorded

### Implementation

- [ ] T012 [US1] Create the `knowledge_chunks` table in `api/app/models/chat.py` per data-model.md: `source_type` enum (`service`,`process`,`pricing`,`faq`,`case_study`,`industry_page`,`knowledge_entry`); `source_id` varchar(100); `source_key` varchar(120); `url` varchar(300); `title` varchar(200); `content` "≤ ~400 tokens"; `is_core` bool; `tsv` tsvector **generated** as `setweight(to_tsvector('english', title),'A') || to_tsvector('english', content)` with a GIN index; `source_updated_at`. Add an Alembic migration.
- [ ] T013 [US1] Implement `api/app/ai/knowledge.py`:
  - builders per source: services from a JSON artefact exported by the web build (`web/content/services` → `api/app/data/services.json` via a `npm run export:services` script), FAQs, case studies (title, client, industry, services, results, summary), industry pages, price ranges, and knowledge entries;
  - `rebuild_source(type, id)`, registered as a 004 `publishing.after_commit` hook, and `rebuild_all()`;
  - `core_facts()`;
  - `retrieve(question, previous_question)` with a synonym map, `ts_rank_cd`, top 6 and a 2,500-token budget (estimated as characters ÷ 4).
- [ ] T014 [US1] Write the frozen system prompt `api/app/ai/prompts/chat_system.md`:
  - answer only from the provided context in about 120 words or fewer, in English;
  - end with `<<sources: …>>` using ids from the context, or `<<declined>>`;
  - never state prices other than those given, and never deadlines, results, guarantees, discounts or commitments;
  - never ask for contact details; offer the inquiry form or WhatsApp when the visitor shows interest.

  Contains no dates or ids.
- [ ] T015 [US1] Create the models `chat_conversations` and `chat_messages` in `api/app/models/chat.py` per data-model.md, with an Alembic migration:
  - **`chat_conversations`**: `visitor_key_hash`, `ip_hash`, `start_page`, `pages` (max 20), `message_count`, `handoff` enum (`none`,`inquiry`,`whatsapp`), `handoff_summary` varchar(600), `handoff_services`, `lead_id`, `is_test`, `model`, `created_at`, `last_message_at`, `delete_after`.
  - **`chat_messages`**: `role` enum (`visitor`,`assistant`); `content` "masked; visitor ≤ 500 characters"; `retrieved_keys`; `source_ids`; `declined`; `outcome` enum (`ok`,`price_guard_replaced`,`refused`,`timeout`,`error`); `rating`; token counts.
- [ ] T016 [US1] Implement `api/app/routers/chat.py`:
  - `GET /api/v1/chat/config`;
  - `POST /api/v1/chat/messages` (SSE via sse-starlette, a 20 s hard deadline; mask → retrieve → stream → strip markers → resolve links → store → `done`);
  - `GET /api/v1/chat/conversations/{id}` (same `X-Visitor-Id`, at most 24 hours old).
- [ ] T017 [US1] Create `web/lib/chat/client.ts`: a typed SSE reader over `fetch` + `ReadableStream` for the events `meta`, `delta`, `replace`, `done` and `error`, sending `X-Visitor-Id` (a random UUID in localStorage, try/catch fallback to memory); replace `web/lib/chat/mock.ts`
- [ ] T018 [US1] Wire `web/components/chat/ChatPanel.tsx` and `ChatLauncher.tsx` (existing prototypes):
  - "AI assistant" title, welcome message, sensitive-info notice and 3 suggested questions from config;
  - a streaming render with an "AI-generated" label per answer and up to 3 links;
  - conversation restore across pages (id in sessionStorage);
  - lazy-loaded panel, dialog semantics, focus management, Escape closes, answers announced, reduced motion respected;
  - the launcher is not rendered under `/admin`.

---

## Phase 4: User Story 2 – Out-of-scope questions declined (P1)

**Goal**: Polite declines and no invented commitments or prices.

**Independent Test**: With FakeGroq returning `<<declined>>`, `done.declined=true` and contact options are shown. A fake answer containing "PKR 99,000" (not a published bound) produces a `replace` event with the safe pricing text. A message in Urdu script gets the English-only reply.

- [ ] T019 [P] [US2] Tests in `api/tests/test_chat_declines.py`: the declined flag; price-guard replacement with `outcome=price_guard_replaced`; an empty answer or refusal becomes a decline with `outcome=refused`; injection text in the visitor message is passed only inside the user turn (never the system prompt)
- [ ] T020 [US2] Implement the price guard and decline handling in `api/app/routers/chat.py` (the `replace` event; the decline adds the contact options flag), and a pre-check for mostly Arabic or Urdu script (> 50% of letters) that returns the canned English-only reply with WhatsApp without calling Groq
- [ ] T021 [US2] Render declines in `web/components/chat/ChatPanel.tsx` with the "Send an inquiry" and "Continue on WhatsApp" buttons highlighted

---

## Phase 5: User Story 3 – Hand off without retyping (P1)

**Goal**: The inquiry form or WhatsApp pre-filled with a summary; the lead is linked.

**Independent Test**: Chat about SEO for a clinic, choose "Send an inquiry": the form opens with an editable summary and SEO ticked; after submitting, the lead has `source=chat_assistant`, a summary labelled AI-generated and a linked conversation. When the summary fails, the visitor's questions are used instead.

- [ ] T022 [P] [US3] Tests in `api/tests/test_handoff.py`: a strict json_schema summary (`summary` ≤ 600, `services` enum array 0–5, `whatsapp_text` ≤ 300) with `ai_generated=true`; fewer than 2 visitor messages skips the model; invalid output or a timeout (10 s) falls back to the visitor's questions with `ai_generated=false`; only the masked transcript is sent
- [ ] T023 [P] [US3] Test in `api/tests/test_chat_lead_link.py`: `LeadCreate.chat_conversation_id` with the same `X-Visitor-Id` and a conversation under 24 hours old sets `source=chat_assistant` and `lead_id`; another visitor's id or an old conversation is ignored
- [ ] T024 [US3] Implement `api/app/ai/summary.py` (`openai/gpt-oss-20b` via `ai/structured.py`) and `POST /api/v1/chat/conversations/{id}/handoff`
- [ ] T025 [US3] Extend 001: add optional `chat_conversation_id` to `LeadCreate` in `api/app/models/lead.py` and the linking in `api/app/services/lead_service.py`; update `specs/001-project-inquiry-flow/contracts/leads.openapi.yaml`; regenerate the web types
- [ ] T026 [US3] In `web/components/chat/ChatPanel.tsx`, "Send an inquiry" calls handoff then `openInquiry({ services, message, chat_conversation_id })` (extend the 001 provider and InquiryForm prefill); "Continue on WhatsApp" opens `wa.me` with the encoded `whatsapp_text` and tracks `chat_whatsapp_handoff`

---

## Phase 6: User Story 4 – Graceful limits and failures (P2)

**Goal**: Daily limits, a site cap and provider fallbacks, never an error message.

**Independent Test**: The 21st message is refused with the reset time; a Groq 500, 429 or timeout shows contact options; a reached spend cap makes chat unavailable and emails admins once.

- [ ] T027 [P] [US4] Tests in `api/tests/test_chat_limits.py`: 20 per visitor per PKT day (the 21st returns 429 with `reset_at`); 60 per IP hash; Turnstile required on the first message of a conversation; input over 500 characters returns 400; with the cap reached, `/chat/config.available=false` and messages return 503, with one admin email per day; failures show contact options and aren't counted as a success
- [ ] T028 [US4] Implement the limits (the 001 `rate_limit_hits` helper), Turnstile on the first message, and the cap check with the admin email (`api/app/templates/email/ai_cap_reached.{html,txt}`) in `api/app/routers/chat.py`
- [ ] T029 [US4] Implement the ChatPanel states in `web/components/chat/ChatPanel.tsx`: `limit` (reset time + contact options, input disabled), `unavailable` (inquiry, WhatsApp, email), `timeout` (retry + contacts), a 500-character counter, and the Turnstile widget on the first message

---

## Phase 7: User Story 5 – Admins keep knowledge current (P2)

**Goal**: Knowledge entries, settings, sources and a test console; admin only.

**Independent Test**: Publishing a knowledge entry makes it retrievable immediately and unpublishing removes it; the welcome text updates; editors are refused; test chats don't count toward limits or statistics.

- [ ] T030 [P] [US5] Tests in `api/tests/test_assistant_admin.py`: knowledge entry CRUD is admin only (editors get 403) with `answer` ≤ 1,000 and plain text; publish and unpublish rebuild the chunks; settings GET and PUT; `sources` returns counts; `test` streams with `is_test=true` and doesn't touch `rate_limit_hits` or statistics; `reindex` returns 202
- [ ] T031 [US5] Create the models `assistant_knowledge_entries` (+ PublishableMixin; `title` varchar(120), `answer` varchar(1000)) and `assistant_settings` (single row: `welcome_message` varchar(300), `suggested_questions` 3 × varchar(120), `daily_message_limit` default 20, `daily_cost_cap_usd`) in `api/app/models/chat.py`, with an Alembic migration
- [ ] T032 [US5] Implement `api/app/routers/admin_assistant.py` (admin only): settings, knowledge entries via the 004 factory restricted to admins, `sources`, `test` (SSE), `reindex`
- [ ] T033 [US5] Create `web/app/admin/assistant/page.tsx` (settings, sources, usage), `knowledge/*` (entries) and `test/page.tsx` (console reusing ChatPanel in test mode)

---

## Phase 8: User Story 6 – Conversations that became inquiries (P3)

**Goal**: An admin list, transcripts and totals.

**Independent Test**: Two handed-off conversations appear with their summary, lead link and transcript; a non-handoff conversation doesn't; 7, 30 and 90-day totals are correct; editors are refused.

- [ ] T034 [P] [US6] Tests in `api/tests/test_assistant_conversations.py`: the list includes only conversations with `lead_id`; totals (chats started, inquiry handoffs, WhatsApp handoffs, declined, fallbacks, helpful, not helpful) exclude `is_test`; the transcript is masked; editors get 403
- [ ] T035 [US6] Implement `GET /api/v1/admin/assistant/conversations` and `/{id}` in `api/app/routers/admin_assistant.py`, and `POST /api/v1/chat/messages/{id}/feedback` in `api/app/routers/chat.py`
- [ ] T036 [US6] Create `web/app/admin/assistant/conversations/page.tsx` and `[id]/page.tsx`; add helpful and not-helpful buttons to each answer in `web/components/chat/ChatPanel.tsx`

---

## Phase 9: Polish

- [ ] T037 [P] Implement `purge_chat()` in `api/app/jobs/chat_jobs.py` (delete conversations where `lead_id IS NULL` and `created_at` is more than 30 days old) and `reindex_knowledge()` as the daily safety net (the 10-minute job is dropped, per DEPLOYMENT D5), both called by the 010 daily cron
- [ ] T038 [P] Update `web/app/(site)/privacy/page.tsx`: the chat is AI-powered, Groq processes messages, what is stored and for how long (FR-031)
- [ ] T039 [P] Track `chat_opened`, `chat_message_sent`, `chat_declined`, `chat_inquiry_handoff`, `chat_whatsapp_handoff`, `chat_limit_reached` and `chat_fallback_shown` in `web/lib/analytics.ts`, with no message content
- [ ] T040 [P] Write the evaluation sets `specs/008-ai-chat-assistant/evals/in_scope.yaml` (50 cases: question, follow-ups, expected source keys, expected behaviour) and `out_of_scope.yaml` (30 cases: off-topic, injection, guarantee, discount, custom quote, other languages)
- [ ] T041 Implement `api/app/evals/chat.py` (manual only, **never in CI**; real Groq free tier; reports the retrieval hit rate, deterministic checks and a `gpt-oss-120b` judge for correctness) and run it once; record the results in `specs/008-ai-chat-assistant/quickstart.md` (targets: ≥ 90% in-scope correct, 100% out-of-scope declined, 0 invented prices)
- [ ] T042 Run quickstart scenarios 1–19 on the Vercel Hobby preview (SSE streaming through the rewrite to the api project)

## Dependencies

- **Order**: Setup → Foundational (T003–T008) → US1 → US2 → US3.
- **After US1**: US4 is independent. US5 needs T013's rebuild hooks. US6 needs US3's lead linking.
- **Downstream**: 009 and 010 depend on Phase 2 (`ai/client.py`, `ai/structured.py`, `ai_usage_daily`).

## Implementation strategy

**MVP**: US1 + US2 + US3 (safe, grounded answers that convert). Then US4 before public launch, then US5 and US6.
