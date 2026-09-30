# Research: Secure Admin Access and Team Roles

> **Hosting update (2026-09-28):** the project runs entirely on Vercel Hobby. The decisions in [DEPLOYMENT.md](../DEPLOYMENT.md) take precedence over this file where they conflict. They are D2 (host-only session cookie on the web domain through same-origin rewrites; replaces R2's `.thebuzzcrew.com` cookie domain; the Origin check uses the web origin) and D5 (login-attempt pruning runs in the daily cron).

## R1. Session mechanism

- **Decision**:
  - Sign-in creates a 256-bit random token, returned in the `bc_session` cookie (`HttpOnly; Secure; SameSite=Lax; Path=/; Domain=.thebuzzcrew.com`). Only `sha256(token)` is stored, in `sessions`.
  - Every protected request looks up the session and checks, in one indexed query plus a user join:
    - the session is not revoked;
    - `now - last_seen_at < 30 min` and `now - created_at < 12 h`;
    - the user is active;
    - the role meets the requirement.
  - `last_seen_at` is updated at most once per minute.
  - A fresh token is issued on every sign-in (FR-011).
- **Rationale**: This meets immediate revocation (FR-010, FR-018, FR-021, FR-022) and per-device sign-out without a denylist. It is recorded as a justified deviation in plan.md.
- **Alternatives considered**: JWT access token plus rotating refresh token (plan.md) was rejected because a role change or deactivation would lag by up to the access-token lifetime, unless every request also hits the database. Auth.js or Clerk were rejected: authentication must live in FastAPI (constitution), and a vendor adds a service.

## R2. Cookie scope across `www` and `api`

- **Decision**: Web runs on `www.thebuzzcrew.com` and the API on `api.thebuzzcrew.com`, which are the same site. The cookie is scoped to `.thebuzzcrew.com`, so:
  - the browser sends it on `fetch(..., { credentials: "include" })` calls to the API;
  - Next.js Server Components read it with `cookies()` and forward it to the API server-to-server.

  CORS allows credentials for the exact `CLIENT_URL` origins only. Preview environments use a fixed pair (`preview.thebuzzcrew.com` / `api-preview.thebuzzcrew.com`). Admin sign-in is not supported on ad-hoc `*.vercel.app` preview URLs. Local development uses the Next.js `/api/v1` rewrite (same origin, host-only cookie).
- **Rationale**: This keeps feature 001's direct-API approach, so real client IPs reach the rate limits and lockout.
- **Alternatives considered**: Routing all traffic through Next.js rewrites was rejected because it masks client IPs and adds a hop. A `__Host-` prefixed cookie was rejected because it cannot be shared between `www` and `api`.

## R3. CSRF

- **Decision**: For unsafe methods (POST/PATCH/DELETE) that carry the session cookie, the API requires an `Origin` header in the `CLIENT_URL` allowlist. Otherwise it returns 403 `csrf_failed`. SameSite=Lax already blocks cross-site form posts. The Origin check covers sibling-subdomain and older-browser cases.
- **Alternatives considered**: Double-submit CSRF tokens were rejected as more moving parts than the Origin check, given SameSite=Lax.

## R4. Password hashing and policy

- **Decision**:
  - **Hashing**: Argon2id via `pwdlib` with default parameters, and rehash on login if the parameters change.
  - **Policy**: at least 12 characters, at most 128, not equal to or containing the email local part, and not in a bundled list of 10,000 common passwords.
  - **Breached check**: the Have I Been Pwned range API (k-anonymity, SHA-1 prefix only, 2 s timeout). If the check times out, the password is accepted after the local checks pass, and a log line is written.
- **Rationale**: This follows FR-015, current NIST guidance, and the constitution's Argon2/bcrypt rule.
- **Alternatives considered**: Composition rules and expiry were rejected as contrary to current guidance. Failing closed when HIBP is down was rejected because it would block invitations and resets during an outage.

## R5. Brute-force and request limits

- **Decision**: A `login_attempts` table records each failure (`email_hash`, `ip_hash`, `attempted_at`). Sign-in counts failures in the last 15 minutes:
  - 5 or more for the email, or 20 or more for the IP, refuses the attempt with 429 `too_many_attempts` (even with a correct password).
  - The first lockout in a window sends a `lockout_notice` email.

  Reset and invitation requests are counted per `email_hash` in a rolling hour (limit 5). Rows older than 24 hours are pruned by a daily cleanup call.
- **Rationale**: This meets FR-012–FR-014 and survives restarts and multiple replicas, unlike in-memory slowapi. Accuracy matters for security, which 001's form limit does not need.
- **Alternatives considered**: slowapi in-memory was rejected because counts are lost on restart and replicas diverge. Redis was rejected as an extra service.

## R6. Tokens for invitations and resets

- **Decision**: 256-bit URL-safe random tokens, sent only by email. `sha256(token)` is stored with `expires_at` (invitation 72 h, reset 1 h) and `used_at`. Issuing a new reset marks older unused ones as used. Changing a password also invalidates outstanding reset tokens and revokes the user's other sessions. Reset requests always return 202 with the same body (FR-025).
- **Alternatives considered**: Signed JWT links were rejected because they cannot be made single-use without storage anyway.

## R7. Web route protection (Next.js 16)

- **Decision**:
  - **`proxy.ts`** (the Next 16 replacement for `middleware.ts`) matches `/admin/:path*` except `/admin/login`, `/admin/forgot-password`, `/admin/reset-password` and `/admin/accept-invite`. With no `bc_session` cookie, it redirects to `/admin/login?next=<path>`. It reads the cookie only and never hits the database, per the Next.js guidance on optimistic checks.
  - **Authoritative check**: `web/lib/auth/session.ts` provides `getCurrentUser()`, wrapped in React `cache()`, which calls `/api/v1/auth/me` with the forwarded cookie. It redirects to login on 401. Pages call `requireRole("admin")` and render `<AccessDenied/>` on failure, before any data fetch.
  - **`next` parameter**: only relative `/admin/...` paths are honoured, to prevent open redirects.
  - **Caching**: responses of confidential admin pages send `Cache-Control: no-store` (FR-006).
- **Rationale**: The Next.js docs recommend optimistic checks in proxy plus a data-access layer, and the API remains the real enforcement.
- **Alternatives considered**: `forbidden()` was rejected because it requires the experimental `authInterrupts` flag. A custom AccessDenied component avoids experimental APIs in production.

## R8. Idle warning and extension

- **Decision**: A client component tracks the last API activity time, shows an accessible dialog at 28 minutes ("You'll be signed out in 2 minutes") with "Stay signed in" (`POST /auth/session/extend`) and "Sign out". At 30 minutes it navigates to `/admin/login?reason=idle`. Activity is shared across tabs with `BroadcastChannel`.
- **Rationale**: This meets FR-009 and WCAG 2.2.1 (Timing Adjustable).

## R9. Last-admin guard and concurrency

- **Decision**: Role changes and deactivations run in a transaction that locks the admin rows (`SELECT ... FOR UPDATE` on active admins). If the change would leave zero active admins, it returns 409 `last_admin`.
- **Rationale**: This meets FR-023, including when two admins act at once (spec edge case).

## R10. Security events

- **Decision**: `security_events` is append-only. The application only inserts, and the database role lacks UPDATE/DELETE on it. It stores `type`, `user_id`, `actor_id`, `ip_hash`, `user_agent_family`, `outcome` and `created_at`, with no passwords or tokens. Retention is at least 12 months, with no deletion job in this feature.
- **Rationale**: This meets FR-027 and FR-028.

## R11. Email address normalisation

- **Decision**: Emails are stored trimmed and lower-cased, with a unique index on `lower(email)`.
- **Rationale**: This meets FR-007 and the invitation-capitalisation edge case.

## R12. First admin

- **Decision**: `uv run python -m app.cli create-admin --email ... --name ...` prompts for a password (no echo), applies the policy and creates an active admin. It refuses to run if any admin already exists, unless `--force` is given. There is no public sign-up route.
- **Rationale**: This meets FR-029.
