# Implementation Plan: Project Inquiry Flow

**Branch**: `001-project-inquiry-flow` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-project-inquiry-flow/spec.md`

## Summary

Replace every `mailto:` call to action with an inquiry form that stores leads, sends two emails and records events. This is the first feature, so it also sets up the monorepo the constitution requires: the existing Next.js app moves into `web/`, and a new FastAPI service is created in `api/` with Neon Postgres (SQLModel + Alembic from day one).

The backend exposes `POST /api/v1/leads`. It validates with Pydantic, verifies Cloudflare Turnstile on the server, rate-limits per IP (5/hour), de-duplicates double submits with an idempotency key, stores the lead, and then sends the team notification and client confirmation through Resend inline, before responding, with each email capped at a 5 s timeout (DEPLOYMENT D4). Delivery outcomes are recorded per email, so email failure never fails the request.

The frontend reuses the existing `InquiryForm` prototype (React Hook Form + Zod) on `/contact` and in a modal opened by every "Start a project" button. It calls the API through generated OpenAPI types, and records `inquiry_submitted` and `whatsapp_clicked` analytics events without PII.

## Technical Context

**Language/Version**: TypeScript 5 (strict) on Next.js 16.3 / React 19.2; Python 3.12+

**Primary Dependencies**:
- **web**: Next.js App Router, Tailwind CSS 4, React Hook Form, Zod 4, `openapi-typescript` + `openapi-fetch`, `@marsidev/react-turnstile`, `@vercel/analytics`
- **api**: FastAPI, SQLModel, Alembic, `psycopg[binary]`, `pydantic-settings`, `email-validator`, `httpx`, `resend`, `structlog`, `jinja2` (rate limits are a Postgres counter, DEPLOYMENT D3)

**Storage**: Neon Postgres (branches: dev, preview, production). Tables `leads` and `email_deliveries`.

**Testing**: pytest + FastAPI TestClient against an isolated Postgres test database, with Resend and Turnstile mocked; Vitest + Testing Library for the form; Playwright for the submit journey, using Turnstile test keys and a mocked email provider.

**Target Platform**: Vercel Hobby (free) for both the `web` and `api` projects (practice project) — see [DEPLOYMENT.md](../DEPLOYMENT.md) and [COSTS.md](../COSTS.md)

**Project Type**: Web application: `web/` (Next.js) + `api/` (FastAPI)

**Performance Goals**: `POST /api/v1/leads` p95 < 300 ms, excluding Turnstile verification latency. Team email sent within 60 s of storage (SC-003). The form adds no LCP regression: the modal and Turnstile load on demand.

**Constraints**:
- 5 submissions per IP per hour.
- Message 10–2,000 characters.
- No PII in logs or analytics.
- CORS allowlist from `CLIENT_URL`.
- WCAG 2.1 AA for the form and modal.
- 360 px mobile width.

**Scale/Scope**: Tens of inquiries per day; one public endpoint, two tables, two email templates, one form reused in two places.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-driven | Spec approved with no `[NEEDS CLARIFICATION]`; artifacts in `specs/001-project-inquiry-flow/` | ✅ Pass. The git branch has not been created yet (no spec-kit git hook); create `001-project-inquiry-flow` before implementation. |
| II. SEO & performance | `/contact` stays a Server Component page with its own metadata; the form is a client island; the modal is lazy-loaded | ✅ Pass |
| III. Contract-first | `POST /api/v1/leads` with Pydantic request/response models; contract in `contracts/`; web types generated with openapi-typescript | ✅ Pass |
| IV. Test-first | pytest (validation, Turnstile failure, 429, email-failure-still-saves, idempotency), Vitest (form), Playwright (journey) are written before the code | ✅ Pass |
| V. Security & privacy | Lead data is write-only publicly (no read endpoint in this feature); secrets from env; logs carry the lead id only; Turnstile on the server; rate limit | ✅ Pass |
| VI. Type safety | TS strict; Pyright strict on `api/`; Zod for the form and env; Pydantic at the boundary | ✅ Pass |
| VII. Accessible & responsive | Labelled fields, `aria-describedby` errors, focus to the first error, dialog focus trap + Escape + focus return, live-region confirmation | ✅ Pass |
| VIII. Simplicity | Emails sent inline after commit (DEPLOYMENT D4) rather than a queue; rate limits in a Postgres counter table (D3); no Redis | ✅ Pass |
| IX. Responsible AI | No AI in this feature | N/A |
| X. Observability | structlog JSON with request id; `GET /api/health` and readiness are introduced here as scaffolding (full monitoring in 002); `lead_created` is recorded as a business event | ✅ Pass |
| Stack & layout | Moves the root Next.js app into `web/` and creates `api/`. This resolves the constitution's follow-up TODO. | ✅ Pass |

**Post-design re-check (after Phase 1)**: Pass. The data model and contract add no new services or abstractions. The idempotency key is a column with a unique index, not a new subsystem.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-inquiry-flow/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # leads, email_deliveries
├── quickstart.md        # Setup + validation scenarios
├── contracts/
│   └── leads.openapi.yaml
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
web/                                  # existing Next.js app moved here (git mv)
├── app/(site)/contact/page.tsx       # renders <InquiryForm/>
├── app/(site)/layout.tsx             # mounts <InquiryModalProvider/> + <WhatsAppButton/>
├── components/inquiry/
│   ├── InquiryForm.tsx               # existing prototype → wired to the API
│   ├── InquiryModal.tsx              # new: accessible dialog, lazy-loaded
│   └── StartProjectButton.tsx        # opens the modal (no mailto)
├── components/WhatsAppButton.tsx     # adds track("whatsapp_clicked")
├── lib/api/
│   ├── schema.d.ts                   # generated by openapi-typescript (do not edit)
│   └── client.ts                     # openapi-fetch client
├── lib/analytics.ts                  # typed track() wrapper (no PII)
├── lib/validation/inquiry.ts         # Zod schema mirrors the Pydantic rules
├── next.config.ts                    # dev rewrite /api/v1/* → FastAPI
└── tests/                            # Vitest + Playwright (e2e/)

api/
├── pyproject.toml                    # uv, ruff, pyright, pytest config
├── alembic/ + alembic.ini
├── app/
│   ├── main.py                       # app factory, CORS, request-id middleware, routers
│   ├── core/config.py                # pydantic-settings (env)
│   ├── core/database.py              # engine + session dependency
│   ├── core/logging.py               # structlog JSON
│   ├── core/rate_limit.py            # Postgres counter limiter (rate_limit_hits), keyed by client IP hash
│   ├── models/lead.py                # SQLModel tables + request/response schemas
│   ├── routers/leads.py              # POST /api/v1/leads
│   ├── routers/health.py             # GET /api/health, /api/health/ready
│   ├── services/lead_service.py      # create lead (idempotent)
│   ├── services/turnstile.py         # siteverify client
│   ├── services/email_service.py     # Resend + templates + delivery records
│   └── templates/email/              # team_notification, client_confirmation (.html/.txt)
└── tests/
    ├── conftest.py                   # test DB, TestClient, fakes for Resend/Turnstile
    ├── test_leads_validation.py
    ├── test_leads_turnstile.py
    ├── test_leads_rate_limit.py
    ├── test_leads_idempotency.py
    ├── test_leads_email_failure.py
    └── test_contract_leads.py
```

**Structure Decision**: This is a web application with the two deployable units the constitution requires. The current root app (`app/`, `components/`, `lib/`, `public/`, configs) moves into `web/` with `git mv`, so history is kept. The Vercel project root becomes `web/`. `api/` follows the constitution's `app/{routers,models,services,core}` + `tests/` layout. `specs/` and `.specify/` stay at the root.

## Complexity Tracking

No violations to justify.
