# Implementation Plan: Secure Admin Access and Team Roles

**Branch**: `003-admin-auth-roles` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-admin-auth-roles/spec.md`

## Summary

FastAPI owns authentication. Next.js only forwards the session cookie and guards routes.

Team members sign in with email and password, which are hashed with Argon2id. Each sign-in creates a server-side session: an opaque random token in an httpOnly, Secure, SameSite=Lax cookie. Only the token's SHA-256 hash is stored. Every API request re-validates the session, which makes these take effect on the very next action:
- idle expiry after 30 minutes;
- absolute expiry after 12 hours;
- sign-out, deactivation, role change and password change.

Role checks (`admin`, `editor`) are FastAPI dependencies applied to every protected router. Other safeguards:
- Brute-force limits (5 failures per account and 20 per IP within 15 minutes) and request limits for resets and invitations are counted in Postgres.
- Invitations and password resets use single-use hashed tokens, sent by Resend.
- Security events go to an append-only table.
- The first admin is created with a `uv run` CLI command.

On the web side:
- `proxy.ts` performs an optimistic redirect to `/admin/login` when the cookie is missing.
- Server Components call `GET /api/v1/auth/me` through a cached data-access helper, and render an access-denied view for insufficient roles.
- The admin navigation hides sections the role cannot use; this is for convenience only, because the API enforces access.

## Technical Context

**Language/Version**: TypeScript 5 strict / Next.js 16.3; Python 3.12+

**Primary Dependencies**:
- **api**: FastAPI, SQLModel, Alembic, `pwdlib[argon2]`, `httpx` (breached-password range check), `resend`, `typer` (CLI), `structlog`
- **web**: React Hook Form + Zod for the auth forms; `proxy.ts`

**Storage**: Neon Postgres. New tables: `users`, `sessions`, `invitations`, `password_resets`, `login_attempts`, `security_events`.

**Testing**: pytest + TestClient for every auth path, plus a parametrised role-matrix test across all protected routes. Playwright for login, logout, idle expiry (with the clock mocked) and editor-refused-on-leads.

**Target Platform**: Vercel Hobby (free) for both the `web` and `api` projects (practice project) — see [DEPLOYMENT.md](../DEPLOYMENT.md) and [COSTS.md](../COSTS.md)

**Project Type**: Web application (`web/` + `api/`)

**Performance Goals**: Session validation adds ≤ 10 ms per request (indexed lookup by token hash). Login p95 < 500 ms, including the Argon2 hash.

**Constraints**:
- Idle timeout 30 minutes (warning at 28); absolute session length 12 hours.
- Lockout: 5 failures per account or 20 per IP within 15 minutes, blocked for 15 minutes.
- Links: invitation 72 hours, reset 1 hour.
- Passwords of at least 12 characters, checked against breached passwords.
- No passwords, tokens or links in logs, errors or analytics.

**Scale/Scope**: Fewer than 20 team accounts; about 15 existing admin pages to protect; about 12 endpoints.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-driven | Spec has no open markers | ✅ Pass |
| II. SEO & performance | Admin pages are `noindex` and excluded from the sitemap (already in robots.ts) | ✅ Pass |
| III. Contract-first | [contracts/auth.openapi.yaml](./contracts/auth.openapi.yaml) defines every endpoint, with 401/403/429 shapes | ✅ Pass |
| IV. Test-first | Auth and role tests are written first; the role matrix covers every protected route | ✅ Pass |
| V. Security & privacy | Server-side role checks on every route; Argon2id; tokens hashed; generic login errors; no PII or passwords in logs | ✅ Pass |
| VI. Type safety | Pydantic and Zod at the boundaries; generated types for the auth client | ✅ Pass |
| VII. Accessible | Auth forms labelled, inline errors, the timeout warning is an accessible dialog with enough time to respond (WCAG 2.2.1) | ✅ Pass |
| VIII. Simplicity | No auth vendor or Redis; counters and sessions in Postgres | ✅ Pass |
| IX. Responsible AI | N/A | N/A |
| X. Observability | `security_events` table; structured logs carry the user id and session id hash only | ✅ Pass |
| Security standard: "short-lived JWTs (or a vetted auth library)" | This plan uses opaque, server-side sessions instead of JWTs | ⚠️ Justified deviation; see Complexity Tracking |

**Post-design re-check**: Pass. The data model and contracts keep all authorisation on the server. The deviation is recorded below.

## Project Structure

### Documentation (this feature)

```text
specs/003-admin-auth-roles/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/auth.openapi.yaml
```

### Source Code

```text
api/app/
├── core/security.py              # hashing, token generation/hashing, cookie settings
├── core/auth.py                  # get_current_session, get_current_user, require_role(...)
├── core/csrf.py                  # Origin allowlist check on unsafe methods with cookies
├── models/user.py                # User, Session, Invitation, PasswordReset, LoginAttempt, SecurityEvent
├── routers/auth.py               # login, logout, me, session/extend, password-reset/*, invitations/accept, password/change
├── routers/users.py              # admin: list, invite, resend/cancel invite, change role, deactivate/reactivate
├── services/auth_service.py      # sign-in flow, lockout, session lifecycle
├── services/password_policy.py   # length, email-match, common list, breached range check
├── services/user_service.py      # invitations, role changes, last-admin guard
├── services/security_events.py   # append-only writer
├── templates/email/              # invitation, password_reset, password_changed, lockout_notice
└── cli.py                        # `uv run python -m app.cli create-admin`
api/tests/
├── test_auth_login.py  test_auth_lockout.py  test_auth_sessions.py
├── test_password_reset.py  test_invitations.py  test_users_admin.py
└── test_role_matrix.py           # every protected route × {anonymous, editor, admin}

web/
├── proxy.ts                      # optimistic: /admin/* without bc_session cookie → /admin/login?next=
├── lib/auth/session.ts           # server-only getCurrentUser() (React cache) → /auth/me; requireRole()
├── components/admin/AccessDenied.tsx
├── components/admin/IdleTimeoutWarning.tsx   # client: 28-min warning dialog, extend/sign out
├── app/admin/login/page.tsx  app/admin/reset-password/page.tsx  app/admin/forgot-password/page.tsx
├── app/admin/accept-invite/page.tsx  app/admin/users/page.tsx
└── app/admin/layout.tsx          # loads the user, filters nav by role, mounts IdleTimeoutWarning
```

**Structure Decision**: This extends the `web/` + `api/` layout from feature 001. Auth code lives in `core/` (cross-cutting dependencies) and `services/` (business rules), as the constitution requires.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Opaque server-side sessions instead of the constitution's "short-lived JWTs (or a vetted auth library)" | The spec requires deactivation, role change, password change and sign-out to take effect on the **very next action** (FR-010, FR-018, FR-021, FR-022, SC-004), plus a 30-minute idle timeout with extension. | Stateless JWTs keep working until they expire. Making them revocable needs a denylist or a per-request database check, which is a session store with extra signing. A hosted auth vendor adds a third service for fewer than 20 users. Opaque tokens stored hashed in Postgres, in httpOnly/Secure/SameSite=Lax cookies, meet every other clause of the security standard. **Proposed constitution PATCH**: allow "server-side sessions" alongside JWTs. |
