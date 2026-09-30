---
description: "Task list for 003 Secure Admin Access and Team Roles"
---

# Tasks: Secure Admin Access and Team Roles

**Input**: `specs/003-admin-auth-roles/` (plan, spec, research, data-model, contracts/auth.openapi.yaml, quickstart), plus `specs/DEPLOYMENT.md`

**Prerequisites**: Feature 001 is complete (`web/` + `api/` layout, database, rate-limit table, email service, same-origin rewrites).

**Tests**: Included (constitution Principle IV; Playwright for admin login is required).

**Deployment note**: the session cookie is **host-only on the web domain** through the same-origin `/api/v1` rewrite (DEPLOYMENT D2; replaces research R2). The CSRF Origin check compares against the web origin(s) in `CLIENT_URL`.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Create branch `003-admin-auth-roles`; add api deps `pwdlib[argon2]` and `typer` to `api/pyproject.toml`; add `IP_HASH_SALT` and `HIBP_ENABLED` to `api/.env.example`
- [X] T002 [P] Bundle a list of 10,000 common passwords at `api/app/data/common_passwords.txt` (a public, permissively licensed list; cite its source in a header comment)

---

## Phase 2: Foundational (blocking)

- [X] T003 Create the models in `api/app/models/user.py` exactly per data-model.md, with an Alembic migration:
  - **Enums**: `user_role` (`admin`,`editor`), `user_status` (`invited`,`active`,`deactivated`), `session_end_reason` (`signed_out`,`idle`,`max_age`,`deactivated`,`password_changed`,`role_changed_forced`), `security_event_type` (all 14 values from data-model.md).
  - **`users`**: `email` varchar(254) "unique on lower(email); stored lower-cased"; `name` varchar(100); `password_hash` varchar(255) nullable "null while invited"; `role`; `status` default `invited`; `last_login_at`; timestamps.
  - **`sessions`**: `token_hash` char(64) unique "the token itself is never stored"; `created_at`; `last_seen_at`; `ended_at`; `end_reason`; `ip_hash`; `user_agent_family`.
  - **`invitations`**: `email`, `role`, `user_id`, `invited_by`, `token_hash` char(64) unique, `expires_at` "created + 72 h", `accepted_at`, `cancelled_at`.
  - **`password_resets`**: `token_hash` unique, `expires_at` "created + 1 h", `used_at`.
  - **`login_attempts`**: `email_hash` char(64), `ip_hash` char(64), `kind` (`login_failed`,`reset_request`,`invite_request`), `attempted_at` (indexed with each hash).
  - **`security_events`**: `type`, `user_id`, `actor_id`, `ip_hash`, `detail` jsonb, `created_at`.
- [X] T004 [P] Implement `api/app/core/security.py`: an Argon2id `PasswordHash` (pwdlib) with `needs_rehash`; `new_token()` (32 bytes, url-safe) and `hash_token()` (sha256 hex); cookie settings for `bc_session` (`HttpOnly; Secure; SameSite=Lax; Path=/`, **no Domain attribute**, DEPLOYMENT D2)
- [X] T005 [P] Implement `api/app/services/security_events.py` `record(type, user_id=None, actor_id=None, request=None, detail={})`, which inserts only and never writes passwords, tokens or URLs. Add a migration statement granting only INSERT and SELECT on `security_events` to the app role (documented in `api/README.md` for Neon).
- [X] T006 Implement `api/app/core/auth.py`:
  - **`get_current_session`**: reads the cookie, hashes it, and loads the session and user in one query. It is valid only when `ended_at IS NULL`, `now < created_at + 12h`, `now < last_seen_at + 30min` and the user is `active`. It updates `last_seen_at` at most once per minute, and ends expired sessions with `idle` or `max_age`. Failure returns 401 `not_authenticated`.
  - **`require_role(*roles)`**: raises 403 `forbidden` and records `access_denied`.
- [X] T007 [P] Implement `api/app/core/csrf.py`: a dependency for POST, PATCH, PUT and DELETE requests that carry `bc_session`, requiring `Origin` to be in the `CLIENT_URL` allowlist, otherwise 403 `csrf_failed`
- [X] T008 [P] Implement `api/app/services/password_policy.py` `check(password, email) -> list[str]`: 12–128 characters; not equal to and not containing the email local part; not in `common_passwords.txt`; and when `HIBP_ENABLED`, not in the HIBP range API (SHA-1 5-character prefix, 2 s timeout; on timeout, accept and log)
- [X] T009 [P] Create the email templates `api/app/templates/email/{invitation,password_reset,password_changed,lockout_notice}.{html,txt}`, containing links only and never passwords
- [X] T010 Create `api/tests/test_role_matrix.py`: load `app.openapi()`, and for every operation with `x-required-role`, assert anonymous → 401, editor → 403 on admin-only operations and admin → neither 401 nor 403, using seeded users and session fixtures in `api/tests/conftest.py`

**Checkpoint**: Auth dependencies exist; the role-matrix test runs (and fails until the routes exist).

---

## Phase 3: User Story 1 – Only signed-in team members reach admin (P1) 🎯 MVP

**Goal**: Email and password sign-in; everyone else is sent to sign-in or refused.

**Independent Test**: Signed out, `/admin/leads/123` redirects to `/admin/login?next=/admin/leads/123`, and `GET /api/v1/leads` returns 401 with no data. Valid credentials sign in and return to `next`.

### Tests

- [X] T011 [P] [US1] Tests in `api/tests/test_auth_login.py`:
  - a correct login sets `bc_session` and returns `Me`;
  - an unknown email, a wrong password and a deactivated account all return an identical 401 `invalid_credentials` body;
  - the cookie flags are correct;
  - an old session token is invalid after a new login (a fresh token on each sign-in);
  - `last_login_at` is set, and a `login_succeeded` or `login_failed` event is recorded.
- [X] T012 [P] [US1] Contract test in `api/tests/test_contract_auth.py` checking responses against `specs/003-admin-auth-roles/contracts/auth.openapi.yaml`
- [X] T013 [P] [US1] Playwright test in `web/e2e/admin-auth.spec.ts`: signed-out redirect with `next`, login, landing on the requested page, logout

### Implementation

- [X] T014 [US1] Implement `api/app/services/auth_service.py` `sign_in(email, password, request)` (normalise the email, verify with a constant-time dummy hash for unknown emails, rehash if needed, create the session, record events) and `sign_out(session)`
- [X] T015 [US1] Implement `api/app/routers/auth.py`: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` (returns `session_expires_at` and `idle_expires_at`), registered under `/api/v1`
- [X] T016 [US1] Implement `api/app/cli.py` `create-admin --email --name` (Typer; password prompt without echo; policy check; refuses when an admin exists unless `--force`), run as `uv run python -m app.cli create-admin`
- [X] T017 [US1] Create `web/proxy.ts` (Next 16 proxy, not middleware): match `/admin/:path*` except login, forgot-password, reset-password and accept-invite; with no `bc_session` cookie, redirect to `/admin/login?next=<path>`; cookie presence only, no database access
- [X] T018 [US1] Create `web/lib/auth/session.ts` (server-only): `getCurrentUser()` wrapped in React `cache()` calls `${API_ORIGIN}/api/v1/auth/me`, forwarding the cookie, and redirects to login on 401; `requireRole(role)` returns the user or `null`
- [X] T019 [US1] Create `web/app/admin/login/page.tsx` (React Hook Form + Zod; the general error message; honours only a relative `next` that starts with `/admin/`), and set `robots: { index: false }` in `web/app/admin/layout.tsx` metadata
- [X] T020 [US1] Update `web/app/admin/layout.tsx` to load `getCurrentUser()`, send `Cache-Control: no-store` for admin responses (via `export const dynamic = "force-dynamic"`, plus a `headers()` rule in `web/next.config.ts` for `/admin/:path*`), and set `frame-ancestors 'none'` / `X-Frame-Options: DENY` for `/admin/:path*` in `web/next.config.ts`

---

## Phase 4: User Story 2 – Editors can't see confidential data (P1)

**Goal**: Role separation per the permission matrix, in both the UI and the API.

**Independent Test**: As an editor, the nav shows content only. Typing `/admin/leads` shows an access-denied page with no lead HTML, and `GET /api/v1/leads` returns 403.

- [X] T021 [P] [US2] Test in `api/tests/test_role_enforcement.py`: an editor gets 403 on `/api/v1/leads*`, `/api/v1/admin/applications*`, `/api/v1/admin/subscribers*`, `/api/v1/users*`, `/api/v1/invitations` and `/api/v1/admin/settings/*`, and each refusal records `access_denied`
- [X] T022 [P] [US2] Playwright test in `web/e2e/admin-roles.spec.ts`: the editor's nav hides leads, applicants, subscribers, users and settings; direct URLs render `AccessDenied`; the page source contains no lead names
- [X] T023 [US2] Create `web/components/admin/AccessDenied.tsx` and call `requireRole("admin")` **before any data fetch** in `web/app/admin/leads/page.tsx`, `web/app/admin/leads/[id]/page.tsx`, `web/app/admin/applications/page.tsx`, `web/app/admin/subscribers/page.tsx` and `web/app/admin/settings/pricing/page.tsx`, and in the admin overview's lead widgets in `web/app/admin/page.tsx`
- [X] T024 [US2] Filter the navigation items by role in the admin sidebar component used by `web/app/admin/layout.tsx` (UI convenience only)
- [X] T025 [US2] Apply `Depends(require_role("admin"))` at router level for the existing and future admin-only routers (leads, applications, subscribers, users, settings) through a shared `admin_only_router()` helper in `api/app/core/auth.py`

---

## Phase 5: User Story 3 – Sessions end on inactivity or sign-out (P1)

**Goal**: 30-minute idle timeout with a warning at 28 minutes, a 12-hour maximum, and per-device sign-out.

**Independent Test**: With a mocked clock, an idle session is refused at 30 minutes (and warned at 28). After sign-out, the back button shows nothing and the old cookie gets 401. Signing out on one device leaves the other signed in.

- [X] T026 [P] [US3] Tests in `api/tests/test_auth_sessions.py` using a frozen clock: idle for 29 minutes is still valid; idle for 31 minutes returns 401 and `end_reason=idle`; 12 hours plus 1 minute returns `max_age`; `POST /auth/session/extend` resets the idle timer but not the 12-hour limit; logout ends only that session
- [X] T027 [US3] Add `POST /auth/session/extend` to `api/app/routers/auth.py`
- [X] T028 [US3] Create `web/components/admin/IdleTimeoutWarning.tsx`: track the last API activity, sharing it across tabs through `BroadcastChannel("bc-activity")`; at 28 minutes, open an accessible `<dialog>` "You'll be signed out in 2 minutes" with "Stay signed in" (calls extend) and "Sign out"; at 30 minutes, navigate to `/admin/login?reason=idle`, and have the login page show "You were signed out due to inactivity". Mount it in `web/app/admin/layout.tsx`.

---

## Phase 6: User Story 4 – Admins manage team accounts (P2)

**Goal**: Invite, accept, change role, deactivate and reactivate, with the last-admin guard.

**Independent Test**: Invite an editor, accept the emailed link within 72 hours, and sign in. Promote them to admin and see new sections on the next request. Deactivating them ends their sessions on every device. Demoting or deactivating the only admin returns 409.

- [X] T029 [P] [US4] Tests in `api/tests/test_invitations.py`:
  - an invite creates an `invited` user and sends an email;
  - accepting within 72 hours with a valid password makes the account `active` and signs the user in;
  - an expired, reused or cancelled link returns 400 `invalid_or_expired_token`;
  - resending cancels the previous link;
  - an existing email (case-insensitive) returns 409 `user_exists`;
  - an editor gets 403.
- [X] T030 [P] [US4] Tests in `api/tests/test_users_admin.py`:
  - a role change applies on the target's next request;
  - deactivation ends all of the target's sessions, and sign-in, reset and invitation acceptance are then refused;
  - reactivation works;
  - the last-admin guard returns 409 `last_admin`, including when two requests race (concurrent test);
  - events are recorded.
- [X] T031 [US4] Implement `api/app/services/user_service.py`: `invite`, `resend_invite`, `cancel_invite`, `accept_invite`, `change_role`, `set_status`. The guard locks active admins with `SELECT … FOR UPDATE`. Deactivating a user ends their sessions with `end_reason=deactivated`.
- [X] T032 [US4] Implement `api/app/routers/users.py` (`GET /users`, `PATCH /users/{id}`, `POST` and `DELETE /users/{id}/invitation`) and `POST /invitations` and `POST /invitations/accept` in `api/app/routers/auth.py`; apply the invitation request limit (5 per email per hour, via `login_attempts` kind `invite_request`)
- [X] T033 [US4] Create `web/app/admin/users/page.tsx` (admin only: list with status and last sign-in, invite form, role select, deactivate and reactivate with confirmation, resend and cancel invite) and `web/app/admin/accept-invite/page.tsx` (password form showing the rules)

---

## Phase 7: User Story 5 – Password reset (P2)

**Goal**: A self-service reset by emailed link, without revealing whether an account exists.

**Independent Test**: Unknown and active emails get the same 202. The active account gets a link valid for 1 hour that works once. The new password works and the old one fails. Other sessions end, and a confirmation email is sent.

- [X] T034 [P] [US5] Tests in `api/tests/test_password_reset.py`:
  - identical 202 responses;
  - no email for unknown or deactivated accounts;
  - the link expires after 1 hour, is single-use, and is invalidated by a newer request and by a password change;
  - a weak password returns 400 `weak_password`;
  - all sessions end after the reset, and the `password_changed` email is sent;
  - requests are limited to 5 per email per hour.
- [X] T035 [US5] Implement `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm` and `POST /auth/password/change` in `api/app/routers/auth.py`, with the logic in `api/app/services/auth_service.py`
- [X] T036 [US5] Create `web/app/admin/forgot-password/page.tsx` and `web/app/admin/reset-password/page.tsx` (token from the query string; the rules shown; success leads to login)

---

## Phase 8: User Story 6 – Brute-force blocking (P2)

**Goal**: Temporary blocks after repeated failures.

**Independent Test**: The 6th attempt on one account within 15 minutes returns 429 even with the correct password and sends a lockout email; it succeeds after 15 minutes. 20 failures from one IP block that IP.

- [X] T037 [P] [US6] Tests in `api/tests/test_auth_lockout.py`, with a frozen clock: 5 failures per `email_hash` within 15 minutes, then the next attempt returns 429 `too_many_attempts` with `Retry-After`; the correct password is still refused; after 15 minutes it succeeds; 20 failures per `ip_hash` blocks the IP; the lockout email is sent once per window; an unknown email still counts
- [X] T038 [US6] Implement the lockout checks in `api/app/services/auth_service.py` before verifying the password, record `login_attempts`, and send `lockout_notice` via 001's `email_service` (inline, DEPLOYMENT D4)
- [X] T039 [US6] Add pruning of `login_attempts` rows older than 24 hours as `prune_login_attempts()` in `api/app/jobs/auth_jobs.py`, to be called by the daily cron entry point created in feature 010 (DEPLOYMENT D5), and runnable now with `uv run python -m app.jobs prune_login_attempts`

---

## Phase 9: Polish

- [X] T040 [P] Test in `api/tests/test_no_secrets_logged.py`: capture logs during all auth tests and assert that no password, token or reset or invite URL appears in logs or in `security_events.detail`
- [X] T041 [P] Accessibility check of the login, reset, accept-invite and idle dialog screens with axe in `web/e2e/admin-auth-a11y.spec.ts`
- [ ] T042 Deploy to the Vercel Hobby previews and run quickstart scenarios 1–13; confirm the `bc_session` cookie is host-only on the web domain and that the CSRF Origin check passes for same-origin requests

## Dependencies

- **Order**: Setup → Foundational → US1 → (US2, US3 in parallel) → US4 → US5 → US6 → Polish. US5 and US6 need only US1 and could run in parallel with US4.
- **Downstream**: Features 004–011 depend on US1 and US2 (`require_role`).

## Parallel examples

- T004, T005, T007, T008 and T009 in Phase 2.
- All `[P]` test tasks within a phase.

## Implementation strategy

**MVP**: US1 + US2 + US3 make the admin area safe to deploy with real data. Then add US4, US5 and US6 before inviting more team members.
