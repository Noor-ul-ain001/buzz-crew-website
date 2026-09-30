---
description: "Task list for 001 Project Inquiry Flow"
---

# Tasks: Project Inquiry Flow

**Input**: Design documents from `specs/001-project-inquiry-flow/`, plus the cross-cutting decisions in `specs/DEPLOYMENT.md` (D1–D9) and `specs/COSTS.md`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/leads.openapi.yaml, quickstart.md

**Tests**: Included. Constitution Principle IV requires test-first work for backend logic and a Playwright journey for inquiry submission. Write each test first and confirm it fails before implementing.

**Organization**: Tasks are grouped by user story (spec.md US1–US5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: US1–US5 as in spec.md
- Paths: `web/` = Next.js app (moved from the repo root in T001), `api/` = FastAPI service

---

## Phase 1: Setup (monorepo + tooling)

**Purpose**: Create the `web/` + `api/` layout the constitution requires, and deployable Vercel Hobby projects (DEPLOYMENT D1). Nothing paid is used.

- [X] T001 Create branch `001-project-inquiry-flow`, then `git mv` the root Next.js app (`app/`, `components/`, `lib/`, `public/`, `next.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json`, `eslint.config.mjs`, `postcss.config.mjs`, `next-env.d.ts`, `AGENTS.md`) into `web/`. Keep `CLAUDE.md`, `specs/`, `.specify/` and `plan.md` at the root, and point `CLAUDE.md` at `web/AGENTS.md`. Verify with `cd web && npm install && npm run build`.
- [X] T002 Scaffold `api/` with uv: `api/pyproject.toml` (Python 3.12; deps fastapi, sqlmodel, alembic, "psycopg[binary]", pydantic-settings, email-validator, httpx, resend, structlog, jinja2; dev deps pytest, pytest-asyncio, ruff, pyright), `[tool.vercel] entrypoint = "app.main:app"` (DEPLOYMENT D1), ruff config, and pyright `strict` for `app/`
- [X] T003 [P] Create `api/.env.example` with `DATABASE_URL` (Neon **pooled** URL), `DATABASE_URL_DIRECT` (for Alembic), `TEST_DATABASE_URL`, `CLIENT_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `TEAM_NOTIFICATION_EMAIL`, `TURNSTILE_SECRET_KEY`, `IP_HASH_SALT`, `CRON_SECRET`; create `web/.env.example` with `API_ORIGIN`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER` (no real values)
- [X] T004 [P] Add web tooling: dev deps `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `@playwright/test`, `openapi-typescript`; deps `openapi-fetch`, `@marsidev/react-turnstile`, `@vercel/analytics`; add scripts `test`, `e2e` and `api:types` (`openapi-typescript http://localhost:8000/openapi.json -o lib/api/schema.d.ts`) in `web/package.json`; create `web/vitest.config.ts` and `web/playwright.config.ts`
- [X] T005 [P] Configure `web/next.config.ts` rewrites: `/api/v1/:path*` → `${process.env.API_ORIGIN}/api/v1/:path*` in every environment (DEPLOYMENT D2; replaces the direct-to-API approach in research R3)
- [X] T006 [P] Add `.github/workflows/ci.yml` running: web `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npx vitest run`, `npm run build`; api `uv sync`, `uv run ruff check .`, `uv run ruff format --check .`, `uv run pyright`, `uv run pytest` against a Postgres service container (no real Resend or Turnstile calls)

---

## Phase 2: Foundational (blocking)

**⚠️ No user story work until this phase is complete.**

- [X] T007 Implement `api/app/core/config.py` (pydantic-settings `Settings` for every T003 variable; fail fast when a required one is missing)
- [X] T008 Implement `api/app/core/database.py`: SQLModel engine on `DATABASE_URL` with `pool_size=1, max_overflow=2, pool_pre_ping=True` (DEPLOYMENT D8), and a `get_session` dependency
- [X] T009 [P] Implement `api/app/core/logging.py` (structlog JSON to stdout; a request-id middleware that reads or creates `X-Request-ID`; never logs request bodies)
- [X] T010 Initialise Alembic in `api/alembic/` + `api/alembic.ini`, using `DATABASE_URL_DIRECT` and SQLModel metadata; document `uv run alembic upgrade head` in `api/README.md`
- [X] T011 Implement `api/app/main.py`: FastAPI app factory, CORS allowlist from `CLIENT_URL` (never `*`), request-id middleware, an error handler that returns the `detail` shape without stack traces, and router registration
- [X] T012 [P] Implement `api/app/routers/health.py`: `GET /api/health` → `{"status":"ok"}`, and `GET /api/health/ready` → 200 or 503 depending on a `SELECT 1`
- [X] T013 Create the `rate_limit_hits` table and model (`key_hash` char(64), `kind` varchar(40), `window_start` timestamptz, `count` int; PK (`key_hash`, `kind`, `window_start`)) in `api/app/models/rate_limit.py`, with an Alembic migration
- [X] T014 Implement `api/app/core/rate_limit.py`: `hit(kind, key, limit, window)` using an atomic `INSERT … ON CONFLICT DO UPDATE SET count = count + 1 RETURNING count`, and `client_ip_hash(request)` = sha256(first `x-forwarded-for` entry + `IP_HASH_SALT`). Exceeding the limit raises 429 `{"detail":{"code":"rate_limited","message":"Too many attempts, please try again later."}}` with `Retry-After` (DEPLOYMENT D3)
- [X] T015 [P] Create `api/tests/conftest.py`: an isolated test database (create_all per session), a TestClient fixture, a `FakeResend` capturing sends with a switchable failure mode, and a `FakeTurnstile` with pass and fail modes
- [X] T016 [P] Create `web/lib/api/client.ts` (an openapi-fetch client with `baseUrl: "/api/v1"`), and run `npm run api:types` once the API boots to generate `web/lib/api/schema.d.ts`
- [X] T017 [P] Create `web/lib/analytics.ts`: a typed `track(event: "inquiry_submitted" | "whatsapp_clicked", props: { source_page: string })` wrapping `@vercel/analytics` `track`, whose type allows no other prop keys (no PII)

**Checkpoint**: The API boots, `/api/health/ready` returns 200 against Neon, and the web app builds from `web/`.

---

## Phase 3: User Story 1 – Submit an inquiry and see confirmation (P1) 🎯 MVP

**Goal**: Every "Start a project" or "Contact" call to action opens a form that stores a lead (status New) and shows a confirmation.

**Independent Test**: On a 360 px viewport, submit valid details through the modal. A `leads` row exists with `status=new` and a timestamp, and the confirmation is announced. Invalid input shows inline errors, and nothing is stored.

### Tests for US1 (write first; they must fail)

- [X] T018 [P] [US1] Contract test in `api/tests/test_contract_leads.py`: `POST /api/v1/leads` request and response shapes match `specs/001-project-inquiry-flow/contracts/leads.openapi.yaml` (201 `LeadCreated` fields `id`, `status`=`new`, `created_at`, `post_process_token`; 422 `HTTPValidationError` shape)
- [X] T019 [P] [US1] Validation tests in `api/tests/test_leads_validation.py`: missing name, name only spaces, invalid email, message under 10 characters after trim, message over 2,000, phone `abc`, empty services, unknown enum values, and honeypot `website` filled. Each returns 422 with the right `loc`, and `SELECT count(*) FROM leads` is unchanged
- [X] T020 [P] [US1] Idempotency test in `api/tests/test_leads_idempotency.py`: two POSTs with the same `idempotency_key` return the same `id`, and only one row exists
- [X] T021 [P] [US1] Vitest test in `web/components/inquiry/InquiryForm.test.tsx`: inline errors appear on blur and on submit, focus moves to the first invalid field, values are kept after a server error, and the success heading receives focus
- [X] T022 [P] [US1] Playwright test in `web/e2e/inquiry.spec.ts`: on a 360×740 viewport, click "Start a project" on `/`, fill the form, submit, and see the confirmation (API with Turnstile test keys and a fake email provider)

### Implementation for US1

- [X] T023 [US1] Create the enums and the `leads` table in `api/app/models/lead.py` exactly per data-model.md:
  - **Enums**: `lead_country` (`pakistan`,`uae`,`uk`,`other`), `lead_service` (`social_media`,`seo`,`web_software`,`ui_ux_design`,`meta_ads`), `lead_budget_range` (`under_50k`,`50k_150k`,`150k_plus`,`not_sure`), `lead_status` (`new`,`contacted`,`proposal_sent`,`won`,`lost`).
  - **Columns**: `name` varchar(100) "trimmed; 1–100 characters"; `email` varchar(254) "stored lower-cased"; `phone` varchar(20) nullable `^\+?[\d\s()-]{7,20}$`; `business` varchar(150) nullable; `services` `lead_service[]` "≥ 1; no duplicates"; `message` text "trimmed; 10–2,000 characters"; `status` default `new`; `source` varchar(40) default `contact_form`; `source_page` varchar(200) "path only"; `idempotency_key` UUID with a **unique index**; `post_process_token_hash` char(64) nullable (010 hook, DEPLOYMENT D4); `created_at`, `updated_at`, `deleted_at`.
  - **Indexes**: `ix_leads_created_at`, `ix_leads_status`.
  - **Schemas**: Pydantic `LeadCreate` and `LeadCreated` per the contract.
  - Add an Alembic migration.
- [X] T024 [US1] Implement `api/app/services/lead_service.py` `create_lead(data, request)`: trim and normalise, return the existing lead on a repeated `idempotency_key`, insert with `status=new`, and generate a 32-byte `post_process_token` (store only its sha256)
- [X] T025 [US1] Implement `api/app/routers/leads.py` `POST /api/v1/leads` (201 `LeadCreated`), registered in `api/app/main.py`. Reject a filled honeypot with a generic 422 and store nothing.
- [X] T026 [P] [US1] Align `web/lib/validation/inquiry.ts` (existing Zod schema) with the Pydantic limits; map the display labels (`COUNTRIES`, `SERVICES`, `BUDGETS`) to the API enum values in `web/lib/validation/enum-map.ts`
- [X] T027 [US1] Wire `web/components/inquiry/InquiryForm.tsx` (existing prototype) to `client.POST("/leads")`:
  - generate `idempotency_key` with `crypto.randomUUID()` when the form mounts;
  - send `source_page = location.pathname`;
  - map 422 `loc` entries to field errors;
  - show the error state with retry plus WhatsApp and email alternatives on network or 5xx errors;
  - show the success state "Thanks! The crew will get back to you within 24 hours." with a WhatsApp alternative;
  - disable the button and set `aria-busy` while submitting.
- [X] T028 [US1] Create `web/components/inquiry/InquiryModal.tsx`: a native `<dialog>` with `showModal()`; focus moves to the heading on open, returns to the trigger on close, and Escape closes it. Keep entered values for the page visit when it's reopened. Load it with `next/dynamic` on first open.
- [X] T029 [US1] Create `web/components/inquiry/InquiryModalProvider.tsx` with a context `openInquiry(options?: { services?: LeadService[] })` (used by 005, 006 and 010), and mount it in `web/app/(site)/layout.tsx`
- [X] T030 [US1] Update `web/components/inquiry/StartProjectButton.tsx` to call `openInquiry()`, and replace every `mailto:` call to action with it: `web/components/nav/MobileMenu.tsx`, `web/app/(site)/page.tsx`, `web/app/(site)/contact/page.tsx` (render `InquiryForm` inline) and `web/components/CtaBand.tsx`. Keep the plain email address as text in the footer and legal pages (FR-001, SC-005).
- [X] T031 [US1] Delete the mock `createLead` in `web/lib/data/leads.ts` once no importer remains

**Checkpoint**: US1 works end-to-end; T018–T022 pass.

---

## Phase 4: User Story 2 – Team notified of every lead (P1)

**Goal**: The team gets an email with all lead details within 1 minute; email failure never loses the lead.

**Independent Test**: Submit an inquiry. A team email captured by FakeResend has every field, the source page and `Reply-To` set to the client. With Resend failing, the response is still 201 and an `email_deliveries` row is `failed`.

### Tests for US2

- [X] T032 [P] [US2] Tests in `api/tests/test_leads_email.py`:
  - the team email contains name, email, phone, business, country, services, budget, message, time and `source_page`, with `Reply-To` = the client email;
  - visitor text containing `<a href>` or `<script>` is escaped (FR-016);
  - with FakeResend failing: 201, the lead exists, and an `email_deliveries` row has `kind=team_notification, status=failed, error_code` set.

### Implementation for US2

- [X] T033 [US2] Create the `email_deliveries` table in `api/app/models/email_delivery.py`: `id` UUID; `lead_id` FK → leads ON DELETE CASCADE; `kind` enum `email_kind` (`team_notification`,`client_confirmation`); `status` enum `email_status` (`sent`,`failed`); `provider_message_id` varchar(100) nullable; `error_code` varchar(60) nullable ("short machine code; never the email address"); `attempted_at`; index `ix_email_deliveries_lead_id`. Add an Alembic migration.
- [X] T034 [P] [US2] Create the templates `api/app/templates/email/team_notification.html` and `.txt` (Jinja2 autoescape; plain text for the message; no auto-linking)
- [X] T035 [US2] Implement `api/app/services/email_service.py` `send(kind, lead)`: Resend SDK with a 5 s timeout, recording an `email_deliveries` row for success or failure; it never raises to the caller
- [X] T036 [US2] In `api/app/routers/leads.py`, after the commit, send the team notification **inline before responding** (DEPLOYMENT D4; research R7's BackgroundTasks is superseded). Skip sending for a repeated `idempotency_key`.

**Checkpoint**: US1 and US2 pass; the team email arrives in seconds (SC-003).

---

## Phase 5: User Story 3 – Client confirmation email (P2)

**Goal**: The client gets an email restating their request and the 24-hour response time.

**Independent Test**: FakeResend captures a confirmation email to the submitted address that includes services, budget, country and message and "within 24 hours". A failure is recorded without affecting the response.

- [X] T037 [P] [US3] Tests in `api/tests/test_leads_confirmation.py`: the confirmation email is sent to the submitted email and contains the display labels for services, budget and country, the message, and "within 24 hours", plus a WhatsApp link; on failure, an `email_deliveries` row is `failed` and the response is 201
- [X] T038 [P] [US3] Create the templates `api/app/templates/email/client_confirmation.html` and `.txt`
- [X] T039 [US3] In `api/app/routers/leads.py`, send the client confirmation concurrently with the team notification (`asyncio.gather`, each with a 5 s timeout)

---

## Phase 6: User Story 4 – WhatsApp contact (P2)

**Goal**: The WhatsApp button on every public page opens a pre-filled chat, and clicks are recorded.

**Independent Test**: Clicking the floating button opens `https://wa.me/<number>?text=<encoded greeting>` in a new tab and fires `whatsapp_clicked` with `source_page`. It is keyboard-focusable with a visible focus ring and an accessible name.

- [X] T040 [P] [US4] Vitest test in `web/components/WhatsAppButton.test.tsx`: the href is built from `NEXT_PUBLIC_WHATSAPP_NUMBER` plus the encoded `WHATSAPP_MESSAGE`, it has `target="_blank"` and `rel="noopener noreferrer"`, and a click calls `track("whatsapp_clicked", { source_page })`
- [X] T041 [US4] Update `web/lib/site.ts` to read `WHATSAPP_NUMBER` from `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER` (fall back to the placeholder in development only), and add the click tracking to `web/components/WhatsAppButton.tsx` and the WhatsApp links in `web/components/inquiry/InquiryForm.tsx`

---

## Phase 7: User Story 5 – Spam and abuse blocked (P2)

**Goal**: Bot-check failures and over-limit submissions are rejected with clear messages, and nothing is stored.

**Independent Test**: With the Turnstile always-fail secret, the request is rejected with a bot-check message. The 6th submission within an hour from one IP returns 429 with "Too many attempts, please try again later".

### Tests for US5

- [X] T042 [P] [US5] Test in `api/tests/test_leads_turnstile.py`: FakeTurnstile in fail mode returns 400 `bot_check_failed` with the message "We couldn't verify you're human. Please try again or message us on WhatsApp.", and no lead or email is created
- [X] T043 [P] [US5] Test in `api/tests/test_leads_rate_limit.py`: 5 submissions per hour per IP hash succeed and the 6th returns 429 with `Retry-After` and nothing stored; a different IP is unaffected

### Implementation for US5

- [X] T044 [US5] Implement `api/app/services/turnstile.py` `verify(token, remote_ip)`: POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with a 5 s timeout, treating a timeout as a failure
- [X] T045 [US5] In `api/app/routers/leads.py`, apply the rate limit (`kind="lead_submit"`, 5 per hour, T014) and then the Turnstile check before validation side effects; return the contract error shapes
- [X] T046 [US5] Add the Turnstile widget (managed mode, no visual puzzle) to `web/components/inquiry/InquiryForm.tsx`, reset the token after each attempt, and render the 400 and 429 messages with WhatsApp and email alternatives in a live region

---

## Phase 8: Polish & cross-cutting

- [X] T047 [P] Fire `track("inquiry_submitted", { source_page })` only after a 201 in `web/components/inquiry/InquiryForm.tsx` (FR-024; no PII)
- [X] T048 [P] Add the privacy notice and a link to `/privacy` under the form's submit button in `web/components/inquiry/InquiryForm.tsx` (FR-026)
- [X] T049 [P] Accessibility pass on the modal and form using `@axe-core/playwright` in `web/e2e/inquiry-a11y.spec.ts` (labels, `aria-describedby` errors, live regions, focus trap), and a manual NVDA check noted in `specs/001-project-inquiry-flow/quickstart.md`
- [X] T050 [P] Log review test in `api/tests/test_no_pii_logs.py`: capture structlog output during all lead tests and assert no name, email, phone or message values appear
- [ ] T051 Create the two Vercel Hobby projects (root `web/` and root `api/`), set the environment variables from T003 (Neon pooled URL for the API), set `API_ORIGIN` in the web project, deploy, and run quickstart scenarios 1–11 against the preview. Record the result, including whether the real client IP arrives through the rewrite (DEPLOYMENT D2 verification), in `specs/001-project-inquiry-flow/quickstart.md`.

---

## Dependencies & execution order

- **Setup (T001–T006)** → **Foundational (T007–T017)** → user stories.
- **US1 (T018–T031)** blocks US2 and US3 (same endpoint). US4 (T040–T041) depends only on Phase 2. US5 (T042–T046) depends on US1's endpoint.
- **Within each story**: tests → models → services → endpoint → UI.
- **Polish (T047–T051)** after all stories.

```text
Setup → Foundational → US1 → US2 → US3
                    ↘ US4
                     US1 → US5
                                 → Polish
```

## Parallel examples

- **Setup**: T003, T004, T005 and T006 together after T001–T002.
- **US1 tests**: T018, T019, T020, T021 and T022 together.
- **US4**: T040–T041 can run alongside US2 and US3.

## Implementation strategy

1. **MVP**: Phases 1–3 (US1). Leads are captured and every `mailto:` link is gone.
2. **Next**: US2, then US5, which is protection before any public launch.
3. **Then**: US3 and US4, then Polish, including deployment (T051).
