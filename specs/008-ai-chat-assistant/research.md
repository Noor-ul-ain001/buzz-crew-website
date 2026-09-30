# Research: AI Chat Assistant

> **Hosting update (2026-09-28):** the project runs entirely on Vercel Hobby. The decisions in [DEPLOYMENT.md](../DEPLOYMENT.md) take precedence over this file where they conflict. They are D1–D3 (hosting, routing, Postgres limits; `visitor_usage` merges into `rate_limit_hits`) and D5 (the 10-minute reindex is dropped: chunks are rebuilt in the same transaction as each publish, with the daily cron as the safety net). SSE streaming works on Vercel's Python runtime.

> Revised 2026-09-28: the project owner ruled out the Claude API; the AI provider is **Groq**. Facts about Groq below were checked against console.groq.com/docs (models, structured outputs, reasoning, rate limits, prompt caching) on 2026-09-28 and must be re-verified at implementation, because model lists change.

## R1. Provider and models

- **Decision**: Groq API via the official `groq` Python SDK (`from groq import Groq`, `client.chat.completions.create(...)`). Model ids are configuration, with these defaults:

  | Use | Model | Why |
  |-----|-------|-----|
  | Chat answers (streamed) | `openai/gpt-oss-120b` | Best quality of Groq's production models; 131K context; about 500 tokens per second; $0.15/$0.60 per 1M tokens |
  | Handoff summary (structured) | `openai/gpt-oss-20b` | Supports strict structured outputs; about 1,000 tokens per second; $0.075/$0.30 per 1M tokens |

  The GPT-OSS models are reasoning models, called with `reasoning_effort="low"` for speed and `include_reasoning=False`, so reasoning text is never returned or streamed.
- **Rationale**: These are the only Groq production models with strict json_schema structured outputs, and they support automatic prompt caching. `llama-3.3-70b-versatile` remains a configurable alternative for chat.
- **Alternatives considered**: `llama-3.1-8b-instant` for chat was rejected: it is cheaper but weaker at following "answer only from context" rules.

## R2. Rate limits and plan

- **Decision**: The Groq **free tier** is used in development and production. The paid Developer plan (250K tokens and 1K requests per minute, pay per token) is **not** used unless the owner approves it; see [COSTS.md](../COSTS.md).
- **Rationale**: The free tier allows GPT-OSS models 30 requests per minute, 1K requests per day, 8K tokens per minute and 200K tokens per day. A single chat turn is about 5K tokens, so the free tier would allow roughly one or two answers per minute site-wide. The Developer plan allows 250K tokens and 1K requests per minute.
- **Handling limits**: a Groq 429 is treated like any provider failure. The chat retries once if `retry-after` is 2 s or less; otherwise it shows `unavailable` with contact options (FR-023).
- **Free-tier consequences** (for the owner's decision): roughly 1–2 chat answers per minute site-wide and about 40 answers per day before the 200K-tokens-per-day cap. Beyond that, visitors see contact options instead of answers. The visitor and site limits (R8) and the admin spend cap still apply. For reference, if the Developer plan were approved, an answer would cost about $0.001.

## R3. Grounding: retrieval with Postgres full-text search

- **Decision**: Use `knowledge_chunks`, one chunk of up to about 400 tokens per logical unit:
  - one per service section, FAQ, case study summary with its results, industry page section and knowledge entry;
  - one per service for its price ranges.

  The `tsv` column is generated as `setweight(to_tsvector('english', title), 'A') || to_tsvector('english', content)`, with a GIN index.

  **Retrieval** runs on the latest question plus the previous visitor message:
  1. `websearch_to_tsquery('english', …)`, expanded with a small synonym map kept in code (for example instagram/facebook/tiktok → social media; google/ranking → seo; website/app/shopify → web software; ads/boost/meta → meta ads; clinic/dentist → healthcare dental; restaurant/cafe → food beverages).
  2. Order by `ts_rank_cd`, and take the top 6 within a 2,500-token budget.

  **Core facts block** (about 800 tokens, always included): the five services with one-line summaries and URLs, all published price ranges, and contact options. It prevents misses on the most common questions.

  **Refresh**: a source's chunks are rebuilt in the same transaction as publish, unpublish or edit, through a hook in 004's `publishing.py` and in pricing saves (010). A reindex job every 10 minutes is the safety net, and admins can also trigger a full reindex.
- **Rationale**:
  - This keeps prompts about 5K tokens or less, which Groq's per-minute token limits require (R2). The earlier full-context design (a 40K-token prompt) cannot run on Groq's free tier.
  - Postgres full-text search is built into Neon, so there is no new service or embeddings provider (Groq offers no embeddings).
  - This meets FR-008 and FR-024.
- **Alternatives considered**:
  - pgvector with an embeddings API was rejected because it adds a provider and an extension.
  - Full-context grounding was rejected because it exceeds the free-tier limits and is costly per request.
  - **Revisit trigger**: the evaluation set shows retrieval misses above 10% of in-scope questions, in which case consider pgvector and an embeddings provider approved by the lead.

## R4. Prompt layout and caching

- **Decision**: Messages are ordered: `system` (frozen instructions, then the core facts block), then retrieved chunks as a context message, then the conversation. There are no timestamps or ids in the frozen part.
- **Rationale**: Groq caches identical prefixes automatically for GPT-OSS models, with cached tokens charged at 50% and not counted toward rate limits. Keeping the stable part first maximises reuse. There is no code-level cache control, and `usage` reports cached tokens where available, which are logged.

## R5. Sources, declines and links

- **Decision**: The model ends each answer with `<<sources: id1, id2>>` (up to 3 chunk source ids from the provided context) or `<<declined>>`. The server:
  - buffers the trailing `<<…>>` so it never reaches the visitor;
  - maps ids to *currently published* URLs and drops the rest;
  - sends `done {links, declined}`.

  An empty answer, or a response that ends without content (a model refusal or content filter), becomes a decline with contact options.
- **Rationale**: This meets FR-005, FR-009 and FR-029 statistics. Structured outputs can't be used for streamed chat, because Groq doesn't support streaming with structured outputs.

## R6. Invented-price guard

- **Decision**: After the stream completes, currency amounts (PKR, Rs, AED, £, $, including "k" forms) must equal a published range bound. Otherwise the server sends a `replace` event with a safe pricing message and logs the event without content.
- **Rationale**: This is defence in depth for FR-010 and SC-002.

## R7. Sensitive data masking

- **Decision**: Card numbers (Luhn-checked, 13–19 digits), IBANs, Pakistani CNIC and Emirates ID numbers become `[removed]` before storage and before any Groq call. The model is told never to ask for contact details.
- **Rationale**: This meets FR-014 and FR-015; data is minimised for the external processor.

## R8. Limits and cost cap

- **Decision**:
  - **Visitor key**: `sha256(X-Visitor-Id)`, falling back to the IP hash.
  - **Limits**: 20 visitor messages per PKT day, and 60 per IP hash per day.
  - **Bot protection**: Turnstile on the first message of each conversation.
  - **Spend cap**: `ai_usage_daily` records tokens, including cached tokens, and the estimated cost from the configured price table. Reaching the admin-set cap switches the public AI tools to contact options and emails the admins once per day.
- **Rationale**: This meets FR-021 and FR-022.

## R9. Streaming transport

- **Decision**: SSE over `POST /api/v1/chat/messages` (`sse-starlette`), with events `meta`, `delta`, `replace`, `done` and `error{limit_reached|unavailable|timeout|refused}`. Server side, the Groq stream (`stream=True`) is consumed and only `choices[0].delta.content` is forwarded; reasoning is disabled by `include_reasoning=False`. There is a hard 20 s deadline.
- **Rationale**: This meets FR-005 and FR-023.

## R10. Handoff summary with structured output

- **Decision**: `client.chat.completions.create(model="openai/gpt-oss-20b", reasoning_effort="low", include_reasoning=False, response_format={"type": "json_schema", "json_schema": {"name": "handoff_summary", "strict": True, "schema": HandoffSummary.model_json_schema(...)}})`. The schema has all fields required and `additionalProperties: false`: `summary` (up to 600 characters), `services` (enum array, 0–5) and `whatsapp_text` (up to 300 characters). The response content is parsed and re-validated with Pydantic, because length limits are enforced by us.
  - **On failure** (a timeout after 10 s, an error, or invalid output): `summary` becomes the visitor's own questions, and there are no services.
  - **Short chats**: fewer than 2 visitor messages skip the summary.
- **Rationale**: This meets FR-017–FR-020 and Principle IX. Strict mode uses constrained decoding on these models.

## R11. Lead linking (001 extension)

- **Decision**: `LeadCreate` gains an optional `chat_conversation_id`. It is valid only when the conversation belongs to the same visitor key and is less than 24 hours old; the lead then gets source `chat_assistant` and the conversation gets `lead_id`.
- **Rationale**: This meets FR-018.

## R12. Evaluation

- **Decision**: Question sets live in `specs/008-ai-chat-assistant/evals/`. The runner calls the real Groq API with seeded knowledge and grades:
  - **Deterministic checks**: markers, the price guard and source ids.
  - **Correctness**: a model-graded check using `openai/gpt-oss-120b` as the judge, run manually rather than in CI. It also measures retrieval hit rate (whether the expected source was among the retrieved chunks).
- **Rationale**: This meets SC-001 and SC-002. The retrieval hit rate drives the R3 revisit trigger.
