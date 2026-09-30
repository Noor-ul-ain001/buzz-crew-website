# Quickstart: Project Inquiry Flow

## Prerequisites

- Node.js 20+, npm; Python 3.12+ and `uv`
- A Neon project with a `dev` branch (connection string) and a separate test database
- Resend API key (a test domain is fine for development) and Cloudflare Turnstile keys (development uses Cloudflare's test keys)

## Environment

`api/.env` (documented in `api/.env.example`):

```text
DATABASE_URL=postgresql+psycopg://...neon.../buzzcrew_dev
TEST_DATABASE_URL=postgresql+psycopg://.../buzzcrew_test
CLIENT_URL=http://localhost:3000
RESEND_API_KEY=re_...
EMAIL_FROM=The Buzz Crew <hello@thebuzzcrew.com>
TEAM_NOTIFICATION_EMAIL=buzzcrewofficial@gmail.com
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA   # Cloudflare always-pass test secret
```

`web/.env.local` (documented in `web/.env.example`):

```text
NEXT_PUBLIC_API_URL=            # empty in dev: calls go through the /api/v1 rewrite
API_DEV_ORIGIN=http://localhost:8000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
NEXT_PUBLIC_WHATSAPP_NUMBER=923000000000
```

## Run

```bash
cd api && uv sync && uv run alembic upgrade head && uv run fastapi dev app/main.py   # :8000
cd web && npm install && npm run api:types && npm run dev                            # :3000
```

`npm run api:types` runs `openapi-typescript http://localhost:8000/openapi.json -o lib/api/schema.d.ts`.

## Test

```bash
cd api && uv run ruff check . && uv run pyright && uv run pytest
cd web && npx tsc --noEmit && npm run lint && npx vitest run && npx playwright test e2e/inquiry.spec.ts
```

## Validation scenarios

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Happy path (US1, US2, US3) | On a 360 px viewport, click "Start a project" on the home page, fill in valid details, submit | Modal shows the confirmation, focus moves to its heading; one `leads` row with `status=new`, `source_page=/`; two `email_deliveries` rows with `status=sent`; `inquiry_submitted` event fired |
| 2 | Contact page | Open `/contact` | Form rendered inline, no `mailto:` call to action on the page |
| 3 | Inline validation (FR-005) | Submit with an empty name, email `abc`, message `short` | Three inline errors, focus on Name, no request stored (`SELECT count(*) FROM leads` unchanged) |
| 4 | Server re-validation (FR-007) | `curl` POST with `message: "hi"` | 422 with `loc: [body, message]`; nothing stored |
| 5 | Bot check (FR-019) | Set `TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA` (always-fail) and submit | Clear bot-check message offering WhatsApp; no lead; no email |
| 6 | Rate limit (FR-021) | Submit 6 valid inquiries within an hour from one IP | The sixth returns 429 and the form shows "Too many attempts, please try again later" |
| 7 | Double submit (edge case) | Send the same payload twice with the same `idempotency_key` | Both return the same `id`; one lead; one pair of emails |
| 8 | Email failure (FR-014, FR-015) | Set `RESEND_API_KEY=invalid` and submit | 201 and on-screen success; lead stored; both `email_deliveries` rows `failed` with an `error_code` |
| 9 | Keyboard & screen reader (FR-022) | Complete the form with keyboard only; NVDA/VoiceOver pass | Focus trapped in the dialog, Escape closes it and returns focus to the trigger, errors announced, success announced |
| 10 | WhatsApp (US4) | Click the floating WhatsApp button | `wa.me/<number>?text=<encoded greeting>` opens in a new tab; `whatsapp_clicked` event with `source_page` |
| 11 | No PII in logs (Principle V) | Grep API logs after scenarios 1–8 | Only lead ids and request ids; no names, emails, phones or messages |

Contract details: [contracts/leads.openapi.yaml](./contracts/leads.openapi.yaml). Data details: [data-model.md](./data-model.md).
