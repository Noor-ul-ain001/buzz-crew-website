# Implementation Plan: AI Chat Assistant

**Branch**: `008-ai-chat-assistant` | **Date**: 2026-09-28 (revised: AI provider changed to Groq) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-ai-chat-assistant/spec.md`

## Summary

The chat runs entirely on FastAPI, using the **Groq API** (`groq` Python SDK). The Groq key never reaches the browser, and the project uses no Anthropic or Claude API.

**Grounding** is retrieval-based, using **Postgres full-text search** (no vector store and no embeddings service):
- Published content (service copy, process, industry pages, case studies, FAQs, pricing ranges and assistant knowledge entries) is split into `knowledge_chunks`, each with its source id and public URL, and indexed with a `tsvector`.
- Each question retrieves the top chunks, up to about 2,500 tokens.
- A small, always-included **core facts** block (the five services with their URLs, published price ranges and contact options) sits first in the prompt, after the frozen instructions, so Groq's automatic prompt caching can reuse that prefix.
- The whole prompt stays around 4–5K tokens, within Groq's per-minute token limits.
- Chunks are rebuilt when content is published or unpublished, which meets the spec's 15-minute refresh.

**Chat**: `POST /api/v1/chat/messages` streams Server-Sent Events from `openai/gpt-oss-120b` with `reasoning_effort="low"` and `include_reasoning=False`, so only the answer text is streamed.
- **Rules**: the system prompt restricts answers to the provided context. It forbids invented prices, deadlines, guarantees and commitments, and requires a polite decline with contact options otherwise.
- **Markers**: answers end with markers for cited sources and declines. The server resolves up to 3 published URLs and strips unknown ones.
- **Price check**: after the stream ends, any currency figure is checked against the published price ranges.

**Guardrails**:
- **Limits**: 500-character input limit, 20 messages per visitor per day, a per-IP ceiling, Turnstile on the first message, and a site-wide daily spend cap.
- **Timeouts**: 3 s to the first token is the target; the hard timeout is 20 s.
- **Fallback**: if Groq returns an error, a rate limit (429) or a refusal, the chat shows contact options.
- **Masking**: card, bank and national ID numbers are masked before storage and before being sent to Groq.

**Handoff**: `POST /chat/conversations/{id}/handoff` creates a summary with `openai/gpt-oss-20b` using Groq **structured outputs** (`response_format` `json_schema`, `strict: true`), which is then validated again by Pydantic. The 001 inquiry endpoint accepts `chat_conversation_id`, which links the conversation and summary to the lead with source `chat_assistant`.

**Admin**: assistant settings, knowledge entries, "Test the assistant" (excluded from limits and statistics) and the list of conversations that became inquiries, all admin-only.

## Technical Context

**Language/Version**: TypeScript 5 strict / Next.js 16.3; Python 3.12+

**Primary Dependencies**:
- **api**: `groq` (Python SDK: `Groq().chat.completions.create`, streaming for chat and `response_format` json_schema for summaries), FastAPI, SQLModel, `sse-starlette`
- **web**: the existing `ChatLauncher` and `ChatPanel` prototypes, SSE via `fetch` + `ReadableStream`, `@marsidev/react-turnstile`

**Storage**: Neon Postgres (`knowledge_chunks` with a GIN index on the `tsvector`, `chat_conversations`, `chat_messages`, `assistant_knowledge_entries`, `assistant_settings`, `ai_usage_daily`, `visitor_usage`)

**Testing**:
- pytest, with a fake Groq client and no real API calls, per the constitution:
  - chunk building (drafts excluded) and retrieval ranking on seeded content, including synonyms;
  - marker parsing, the price guard and PII masking;
  - limits (visitor, IP, site cap);
  - Groq 429, 5xx and timeout fallbacks, and empty or refused output;
  - handoff schema validation and failure fallback;
  - lead linking, admin-only access and the retention purge.
- Vitest: ChatPanel states.
- Playwright: open chat, ask, hand off (with a mocked SSE stream).
- **Evaluation set**: 50 in-scope and 30 out-of-scope questions, run manually against the real Groq API (`uv run python -m app.evals.chat`), not in CI.

**Target Platform**: Vercel Hobby (free) for both the `web` and `api` projects (practice project), Groq API — see [DEPLOYMENT.md](../DEPLOYMENT.md) and [COSTS.md](../COSTS.md)

**Project Type**: Web application (`web/` + `api/`)

**Performance Goals**: First streamed token ≤ 3 s at p95 (Groq serves `gpt-oss-120b` at roughly 500 tokens per second); complete answer ≤ 15 s; hard stop at 20 s. The chat bundle is lazy-loaded.

**Constraints**:
- **Answers**: English only, about 120 words at most, up to 3 links to published pages.
- **Limits**: 20 messages per visitor per day (reset at midnight PKT).
- **Retention**: non-handoff conversations are deleted after 30 days.
- **Privacy**: no message content in analytics or logs.
- **Prompt size**: about 5K tokens or less.
- **Groq plan**: the free tier (8K tokens per minute, 30 requests per minute and 1K requests per day per model) is the default for production too. Upgrading to the paid Developer plan needs the owner's approval (see [COSTS.md](../COSTS.md)). On the free tier, limit hits show visitors the contact options (research R2).

**Scale/Scope**: Hundreds of conversations per month; hundreds of knowledge chunks.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-driven | No open markers. Handoff conversation retention follows feature 002, still open, and is configured. | ✅ Pass |
| II. SEO & performance | Lazy client island; no effect on server rendering | ✅ Pass |
| III. Contract-first | [contracts/chat.openapi.yaml](./contracts/chat.openapi.yaml) (SSE events), plus the 001 extension (`chat_conversation_id`) | ✅ Pass |
| IV. Test-first | Tests with a fake Groq client first; the evaluation set is written before the prompt | ✅ Pass |
| V. Security & privacy | Key on the server only; masking before any provider call; admin-only transcripts; privacy policy discloses Groq as the AI processor | ✅ Pass |
| VI. Type safety | Strict json_schema plus Pydantic validation of the summary; typed SSE events | ✅ Pass |
| VII. Accessible | Dialog semantics, focus management, live region, Escape closes, reduced motion respected | ✅ Pass |
| VIII. Simplicity | Retrieval with built-in Postgres full-text search: no pgvector, no embeddings provider | ✅ Pass |
| IX. Responsible AI | Backend only; AI-labelled; handoff to a human; answers only from approved content, otherwise decline; limits, timeouts, token budget, fallback; schema-validated output | ✅ Pass |
| X. Observability | Events without content; per-request token usage; admin totals | ✅ Pass |
| Stack: "AI providers: Anthropic Claude API and/or OpenAI" | The project owner has ruled out the Claude API; Groq is not listed | ⚠️ Needs a constitution amendment; see Complexity Tracking |

**Post-design re-check**: Pass, subject to the amendment.

## Project Structure

### Documentation (this feature)

```text
specs/008-ai-chat-assistant/
├── plan.md  research.md  data-model.md  quickstart.md
├── contracts/chat.openapi.yaml
└── evals/  (in_scope.yaml, out_of_scope.yaml — authored during implementation)
```

### Source Code

```text
api/app/
├── ai/client.py                 # Groq client factory, model ids from env, timeouts, 429/5xx handling, usage → ai_usage_daily
├── ai/structured.py             # json_schema(strict) request + Pydantic re-validation helper (used by 008/009/010)
├── ai/knowledge.py              # chunk builder per source, core-facts block, FTS retrieval + synonym expansion
├── ai/prompts/chat_system.md    # frozen system prompt
├── ai/guards.py                 # PII masking, marker parsing, price check, input limits
├── ai/summary.py                # handoff summary (gpt-oss-20b, strict schema)
├── models/chat.py               # KnowledgeChunk, ChatConversation, ChatMessage, AssistantKnowledgeEntry, AssistantSettings, AiUsageDaily
├── routers/chat.py              # POST /chat/messages (SSE), GET /chat/conversations/{id}, POST …/handoff, POST …/feedback
├── routers/admin_assistant.py   # settings, knowledge entries, sources, test, conversations, stats, reindex
├── jobs/purge_chat.py  jobs/reindex_knowledge.py
└── evals/chat.py                # manual evaluation runner (real Groq API, not CI)

web/
├── components/chat/{ChatLauncher,ChatPanel}.tsx   # existing prototypes → SSE client
├── lib/chat/client.ts                             # replaces lib/chat/mock.ts
├── components/inquiry/InquiryForm.tsx             # prefill { message, services, chat_conversation_id }
└── app/admin/assistant/{page,knowledge,test,conversations}/…
```

**Structure Decision**: This extends `web/` + `api/`. All provider code is in `api/app/ai/`, so features 009 and 010 reuse the client, structured-output helper, usage accounting and guards, and a future provider change touches one module.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| AI provider is Groq, while the constitution lists "Anthropic Claude API and/or OpenAI" | The project owner decided not to use a Claude API key and chose Groq. | Staying on the listed providers was ruled out by the owner. **Proposed constitution amendment** (MINOR, since it expands a section): the AI providers line becomes "Groq (default), or another provider approved by the project lead, accessed only from the backend". Principle IX is unchanged. |
