# Implementation Plan: AI Lead Priority, Proposal Drafts, Caption Generator and Cost Estimator

**Branch**: `010-ai-sales-tools` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-ai-sales-tools/spec.md`

## Summary

Every AI call runs from FastAPI and reuses 008's `api/app/ai/` module:
- the **Groq** client factory (no Claude or Anthropic API): `openai/gpt-oss-120b` for proposal drafts, `openai/gpt-oss-20b` for lead priority and captions, with timeouts and handling for 429s and errors;
- usage accounting into `ai_usage_daily`, and the site-wide spend cap;
- output validation: Groq structured outputs (`response_format` json_schema, `strict: true`) re-validated with Pydantic (`ai/structured.py`).

**Lead priority** (admin-only):
- Scoring runs in a separate request that the browser fires after the lead is created, without waiting for it (`POST /leads/{id}/post-process` with a one-time token), for every lead source (DEPLOYMENT D4).
- The input is only the business name, country, services, budget and message, never the email or phone. The message is marked as untrusted data.
- Output: `{priority: hot|warm|cold, reason ≤ 120 chars}`, stored in `lead_ai_insights`.
- Failures leave "Not scored yet". Scoring is retried when an admin opens the lead and by the daily cron, for up to 24 hours (Vercel Hobby cron runs daily only; D5).
- An admin can set their own priority, which is stored on the lead and never touches its status.

**Proposal drafts** (admin-only):
- A strict json_schema call to `openai/gpt-oss-120b` returns a sectioned proposal built from the lead, the published service and process content, published case studies and the configured price ranges.
- The model must put `[[TO CONFIRM: …]]` placeholders wherever it cannot decide (final price, timeline, anything unknown).
- A validator rejects prices outside the configured ranges, unpublished case study references and promise phrases.
- The draft is edited in the admin area, with auto-save and optimistic locking.
- **Approval**: impossible while any `[[` placeholder remains, and records who approved and when.
- **Export**: only approved proposals can be exported, as copied text, PDF (xhtml2pdf, pure Python; D7) or DOCX (python-docx), and each approved proposal keeps a snapshot of its prices.
- There is no sending endpoint.

**Cost estimator** (public): no AI at all.
- `price_ranges` hold PKR minimum and maximum per service and scope, plus a billing type per service.
- `POST /tools/estimate` calculates the totals on the server, with monthly and one-off totals kept separate.
- "Send as an inquiry" goes through the 001 endpoint with an `estimate` payload, which the server recalculates rather than trusting the client. The resulting lead has `source = cost_estimator`.
- Admins edit the ranges in the existing `/admin/settings/pricing` prototype, and every change is recorded in history. The estimator (through the 004 revalidation webhook), the chat assistant's knowledge index (008) and new proposal drafts all use the updated values.

**Caption generator** (public):
- Input: business type, goal, platform and tone.
- Output: a strict json_schema call to `openai/gpt-oss-20b` returns either exactly 5 ideas (idea, caption within the platform's length, up to 8 hashtags) or a decline for harmful requests.
- Limits: Turnstile, and 5 generations per visitor per day. Successful generations and declines count; failures don't.
- Messages in a language other than English get a polite English-only message without calling the model.

## Technical Context

**Language/Version**: TypeScript 5 strict / Next.js 16.3; Python 3.12+

**Primary Dependencies**:
- **api**: `groq`, `xhtml2pdf` (pure-Python PDF), `python-docx`; scheduled work runs through Vercel Cron (DEPLOYMENT D5), FastAPI, SQLModel
- **web**: the existing `Estimator`, `CaptionTool`, admin pricing and lead prototypes; a Markdown editor with preview (the same as 005)

**Storage**: Neon Postgres. New tables `lead_ai_insights`, `proposals`, `price_ranges`, `service_billing`, `pricing_changes`. `leads` gains `admin_priority`, `admin_priority_set_by` and `admin_priority_set_at`, plus an `estimate` column (jsonb). `visitor_usage` gains the kinds `captions_visitor` and `estimate_visitor`.

**Testing**:
- pytest, with the Groq client faked:
  - scoring never changes status; email and phone are not in the AI input; an injection text in the message has no effect on the output handling; invalid output is treated as a failure; the retry schedule works; editors get 403;
  - proposal validator (out-of-range price, unpublished case study, promise phrase), approval blocked while placeholders remain, export blocked before approval, the price snapshot, no send route (contract test);
  - estimator totals equal the configured values exactly, missing ranges become "price on request", the server recalculates an inquiry estimate;
  - pricing validation and history;
  - caption schema (exactly 5, hashtags up to 8, length within the platform limit), declines, non-English short-circuit, limits and failures not counting.
- Vitest: Estimator totals announced; proposal editor placeholder highlighting.
- Playwright: estimate then send as an inquiry; generate captions (mocked); admin approves and downloads a proposal.

**Target Platform**: Vercel Hobby (free) for both the `web` and `api` projects (practice project), Groq API — see [DEPLOYMENT.md](../DEPLOYMENT.md) and [COSTS.md](../COSTS.md)

**Project Type**: Web application (`web/` + `api/`)

**Performance Goals**:
- Lead priority stored within 60 s of lead creation.
- Proposal draft ≤ 60 s.
- Captions ≤ 20 s (hard timeout 30 s).
- Estimate response p95 < 100 ms.
- Pricing changes visible in the estimator within 5 minutes.

**Constraints**:
- AI never changes a lead's status, never sends anything, and never sets prices.
- Public tools: 5 caption generations per day and 100 estimates per day.
- PKR only.
- Admin-only for priorities, proposals and pricing.

**Scale/Scope**: Tens of leads per day; a few proposals per week; hundreds of public tool uses per day.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-driven | No open markers. Depends on 001, 003, 005, 006 and 008 (planned). The leads manager UI comes from an unspecified lead-management feature; this plan adds API fields and minimal lead-detail components that the lead-management feature will host. | ✅ Pass (dependency noted) |
| II. SEO & performance | `/tools/estimate` and `/tools/captions` are server-rendered pages with client islands and unique metadata | ✅ Pass |
| III. Contract-first | [contracts/sales-tools.openapi.yaml](./contracts/sales-tools.openapi.yaml), plus the 001 extension (`estimate`) | ✅ Pass |
| IV. Test-first | Guardrail tests first | ✅ Pass |
| V. Security & privacy | Admin-only data; data minimised for the AI (no email or phone); no PII in events | ✅ Pass |
| VI. Type safety | Every AI output parsed into a Pydantic model; generated TS types | ✅ Pass |
| VII. Accessible | Estimator live-region totals; labelled caption form; the copy action confirmed in text | ✅ Pass |
| VIII. Simplicity | Reuses 008's AI module; daily Vercel Cron (no worker service); pure-Python PDF and DOCX libraries | ✅ Pass |
| IX. Responsible AI | Groq only (no Claude API); suggestions only; human approval required for proposals; the estimator uses no AI; limits, timeouts, spend cap and fallbacks; output validated; AI-generated content labelled | ✅ Pass |
| X. Observability | Events `lead_priority_suggested`, `lead_priority_overridden`, `proposal_generated`, `proposal_approved`, `estimate_calculated`, `estimate_sent`, `captions_generated`, `captions_declined`, `tool_limit_reached` | ✅ Pass |

**Post-design re-check**: Pass.

## Project Structure

### Documentation (this feature)

```text
specs/010-ai-sales-tools/
├── plan.md  research.md  data-model.md  quickstart.md
└── contracts/sales-tools.openapi.yaml
```

### Source Code

```text
api/app/
├── routers/internal_jobs.py        # GET /api/v1/internal/jobs/daily (CRON_SECRET); runs every feature's daily job under advisory locks
├── ai/priority.py                  # schema, prompt, minimal input builder
├── ai/proposal.py                  # schema, prompt, context builder, validator
├── ai/captions.py                  # schema, prompt, platform limits, decline variant
├── models/{lead_ai_insight,proposal,pricing}.py
├── services/pricing_service.py     # ranges, estimate calculation, history, revalidation
├── services/proposal_export.py     # Markdown → HTML → PDF (xhtml2pdf) / DOCX (python-docx)
├── routers/admin_leads_ai.py       # priority get/refresh/override, proposals CRUD/approve/export
├── routers/admin_pricing.py        # GET/PUT ranges, GET history
├── routers/tools.py                # POST /tools/estimate, POST /tools/captions, GET /public/pricing
└── jobs/retry_lead_priority.py     # every 15 min, up to 24 h
web/
├── app/(site)/tools/estimate/page.tsx   components/estimate/Estimator.tsx     # existing → API
├── app/(site)/tools/captions/page.tsx   components/captions/CaptionTool.tsx  # existing → API
├── app/admin/settings/pricing/page.tsx                                       # existing → API + history
└── components/admin/leads/{PriorityBadge,PriorityOverride,ProposalEditor,ProposalList}.tsx
```

**Structure Decision**: This extends `web/` + `api/`. It adds `routers/internal_jobs.py` as the single place where scheduled jobs from all features (004, 007, 008, 009, 010) are registered.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| AI provider is Groq, while the constitution lists Anthropic and/or OpenAI | The project owner ruled out the Claude API and chose Groq | Same amendment as proposed in feature 008's plan (AI providers: "Groq (default), or another provider approved by the project lead") |
