# Research: Project Inquiry Flow

> **Hosting update (2026-09-28):** the project runs entirely on Vercel Hobby. The decisions in [DEPLOYMENT.md](../DEPLOYMENT.md) take precedence over this file where they conflict. They are D1 (two Vercel projects), D2 (same-origin rewrites; replaces R3), D3 (Postgres rate limits; replaces R5's in-memory slowapi) and D4 (emails sent inline after commit; replaces R7's BackgroundTasks).

All Technical Context items are resolved; there are no remaining `NEEDS CLARIFICATION` items.

## R1. Monorepo migration of the existing app

- **Decision**: `git mv` the root Next.js app (`app/`, `components/`, `lib/`, `public/`, `next.config.ts`, `tsconfig.json`, `package.json`, lockfile, `eslint.config.mjs`, `postcss.config.mjs`, `AGENTS.md`, `CLAUDE.md` stays at the root and points at `web/AGENTS.md`) into `web/`. Create `api/` alongside. The Vercel project's root directory becomes `web/`.
- **Rationale**: The constitution mandates exactly two deployable units, `web/` and `api/`, and lists the root layout as a follow-up TODO. Doing it in the first feature avoids moving code later, when more features depend on it.
- **Alternatives considered**: Keeping the app at the root with `api/` beside it was rejected because it contradicts the constitution's repository structure and mixes Python tooling with the Next.js root. A separate API repository was rejected because contract changes and type generation must happen in one PR.

## R2. Next.js 16 specifics that affect this and later plans

- **Decision**:
  - Use `proxy.ts`, not `middleware.ts`, for any request-time logic (needed from feature 003).
  - Use `revalidateTag(tag, "max")` with the required second argument.
  - Use `rewrites()` in `next.config.ts` for the development proxy to FastAPI.
- **Rationale**: The bundled docs (`node_modules/next/dist/docs/`) mark `middleware` as deprecated and renamed to `proxy` in v16. `revalidateTag` without a profile is deprecated.
- **Alternatives considered**: plan.md's `middleware.ts` was rejected because it is deprecated in the installed version.

## R3. How the browser reaches the API

- **Decision**: In development, a Next.js rewrite sends `/api/v1/*` to `http://localhost:8000`. In preview and production, the generated client calls `NEXT_PUBLIC_API_URL` (for example `https://api.thebuzzcrew.com`), and FastAPI CORS allows only `CLIENT_URL` origins (production and preview).
- **Rationale**: This matches the constitution's "Communication between frontend and backend" section. Keeping web and API on the same registrable domain (`thebuzzcrew.com`) also lets feature 003 use `SameSite=Lax` cookies.
- **Alternatives considered**: Proxying all production traffic through Next.js rewrites was rejected because it hides the client IP behind Vercel, complicating per-IP limits, and adds a hop.

## R4. Bot protection

- **Decision**: Cloudflare Turnstile in "managed" mode (invisible for most visitors, no visual puzzle), via `@marsidev/react-turnstile`. The token is sent in the request body and verified server-side against `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `remoteip`. The verification timeout is 5 s. A failure returns 400 with code `bot_check_failed`. Tests use Cloudflare's published always-pass and always-fail test keys.
- **Rationale**: This is the constitution's chosen bot protection, and it meets FR-019/FR-020 (no visual puzzles, screen-reader passable).
- **Alternatives considered**: reCAPTCHA was rejected for privacy reasons and because its puzzles fail FR-020. A honeypot alone is too weak, but a hidden honeypot field is added as a cheap second signal.

## R5. Rate limiting

- **Decision**: slowapi `Limiter` keyed on the client IP (the first trusted `X-Forwarded-For` hop from the platform proxy), with a limit of `5/hour` on `POST /api/v1/leads` and in-memory storage. The response is 429 `{"detail": {"code": "rate_limited", ...}}` with a `Retry-After` header.
- **Rationale**: This is the simplest option that meets FR-021. The API runs as a single replica in this phase (Principle VIII), so in-memory counters are accurate.
- **Alternatives considered**: Redis storage was rejected as an extra service (it would need a Complexity Tracking entry). A Postgres counter table was rejected as more code for no current benefit. **Revisit trigger**: before running more than one API replica, switch slowapi storage to a shared backend.

## R6. Double-submit protection

- **Decision**: The form generates a UUID `idempotency_key` when it opens and sends it with the submission. `leads.idempotency_key` has a unique index. A repeat submission with the same key returns the original lead (201 with the same id) and sends no further emails.
- **Rationale**: This covers double taps, retries after timeouts and network replays (spec edge case), with no extra infrastructure.
- **Alternatives considered**: Only disabling the button was rejected because it does not cover network retries. Hash-of-content de-duplication was rejected because it would wrongly merge genuinely repeated inquiries.

## R7. Email sending and failure recording

- **Decision**: After the lead commits, FastAPI `BackgroundTasks` sends two emails via the Resend Python SDK:
  - **Team notification**: `Reply-To` is the client's email.
  - **Client confirmation**: restates services, budget, country and message, and the 24-hour response time.

  Each attempt writes an `email_deliveries` row (`kind`, `status`, `provider_message_id`, `error_code`, `attempted_at`). Templates are Jinja2 with autoescape and a plain-text alternative. Visitor text is escaped, and links are not auto-linked (FR-016).
- **Rationale**: This meets FR-012–FR-016 and SC-003 (sent seconds after storage) without a queue. The lead is committed before any email work, so failure cannot lose it (FR-014).
- **Alternatives considered**: A job queue (Celery/RQ) was rejected under Principle VIII. Resend-side templates were rejected because keeping templates in the repo keeps them reviewable and testable. Automatic retries beyond the SDK's own were left out: the spec records failures, and resending belongs to the lead-management feature.

## R8. Validation parity between web and api

- **Decision**: Pydantic is the source of truth:
  - `name` 1–100 characters (trimmed)
  - `email` as `EmailStr`, max 254
  - `phone` optional, `^\+?[\d\s()-]{7,20}$`
  - `business` optional, max 150
  - `country` and `services` as enums, with ≥ 1 service
  - `budget_range` as an enum
  - `message` 10–2,000 characters (trimmed)

  The web Zod schema (`web/lib/validation/inquiry.ts`, existing) is aligned to the same limits, with a contract test asserting that the enums match the OpenAPI schema. Server 422 errors map field-by-field to inline form errors.
- **Rationale**: FR-005–FR-007 require identical rules on both sides, and server validation cannot be bypassed.
- **Alternatives considered**: Generating Zod from OpenAPI was rejected as an extra toolchain step for a single form. It can be revisited if forms multiply.

## R9. Enum values

- **Decision**: API enums use lowercase snake case with display labels on the web side:
  - `country`: `pakistan|uae|uk|other`
  - `services`: `social_media|seo|web_software|ui_ux_design|meta_ads`
  - `budget_range`: `under_50k|50k_150k|150k_plus|not_sure`
  - `status`: `new|contacted|proposal_sent|won|lost` (from the existing prototype's statuses; only `new` is set by this feature)
- **Rationale**: These are stable identifiers, independent of copy changes, and follow the constitution's rule that statuses use enums, never free text.
- **Alternatives considered**: Storing display strings, such as "PKR 50k–150k", was rejected because it is brittle when copy changes.

## R10. Analytics events

- **Decision**: A typed `track(event, props)` wrapper in `web/lib/analytics.ts` calls `@vercel/analytics` `track`. Events are `inquiry_submitted {source_page}` (fired after a 201) and `whatsapp_clicked {source_page}`. Props are restricted by type to non-PII keys. The server-side business event `lead_created` is the `leads` row itself plus a structured log line with the lead id.
- **Rationale**: This meets FR-024/FR-025 and constitution Principle X, and feature 002 adopts the same helper.
- **Alternatives considered**: GA4 was deferred to 002, which owns the analytics choice. An events table was rejected as duplicating what the leads table already records.

## R11. Modal accessibility

- **Decision**: Use the native `<dialog>` element with `showModal()`. It provides the focus trap, Escape to close and inert background. Focus moves to the dialog heading on open and returns to the trigger on close. The success heading receives focus and is announced. The modal component is loaded with `next/dynamic` on first click.
- **Rationale**: This meets FR-022 with no extra dependency, and lazy loading protects LCP (Principle II).
- **Alternatives considered**: Radix Dialog was rejected as an extra dependency when the native dialog is sufficient in all supported browsers.

## R12. Source page capture

- **Decision**: The form sends `source_page`, the path only (for example `/work/discovery-homes`), with no query string, to avoid capturing campaign parameters that could contain identifiers. Maximum 200 characters.
- **Rationale**: This meets FR-003, and the privacy-safe choice follows Principle V.
- **Alternatives considered**: The full URL was rejected because of possible PII in query strings.
