# Quickstart: Secure Admin Access and Team Roles

## Prerequisites

Feature 001's `web/` + `api/` setup is running. Additional `api/.env` values:

```text
SESSION_COOKIE_DOMAIN=            # empty locally (host-only via the /api/v1 rewrite); .thebuzzcrew.com in production
IP_HASH_SALT=<random 32 bytes>
HIBP_ENABLED=false                # true in production
```

```bash
cd api && uv run alembic upgrade head
uv run python -m app.cli create-admin --email you@thebuzzcrew.com --name "Your Name"
```

## Test

```bash
cd api && uv run pytest tests/test_auth_*.py tests/test_password_reset.py tests/test_invitations.py tests/test_users_admin.py tests/test_role_matrix.py
cd web && npx playwright test e2e/admin-auth.spec.ts
```

`test_role_matrix.py` enumerates every route with `x-required-role` in the OpenAPI schema and asserts anonymous → 401, editor → 403 on admin-only routes, admin → not 401/403. New protected routes are covered automatically.

## Validation scenarios

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Open `/admin/leads/123` signed out (US1) | Redirect to `/admin/login?next=/admin/leads/123`; after sign-in, lands on that page |
| 2 | `curl https://api.../api/v1/leads` without a cookie | 401 `not_authenticated`, no data |
| 3 | Wrong password vs unknown email | Identical 401 `invalid_credentials` body and similar timing |
| 4 | Six wrong passwords for one account within 15 min (US6) | Sixth returns 429 even with the correct password; lockout email sent; succeeds after 15 min |
| 5 | Sign in as an editor, open `/admin/leads` and `GET /api/v1/leads` (US2) | Access-denied view, no lead data in the HTML; API 403; `access_denied` security event |
| 6 | Idle 28 min (mocked clock) | Warning dialog; "Stay signed in" extends; with no response at 30 min → login with "signed out due to inactivity" |
| 7 | Sign out, then press Back | No admin data rendered (no-store); old cookie → 401 |
| 8 | Invite an editor, accept the link, sign in (US4) | Status Invited → Active; the reused link gets `invalid_or_expired_token` |
| 9 | Change an editor to admin while they are signed in | Their next request sees admin sections |
| 10 | Deactivate a user signed in on two browsers | Both get 401 on their next action; sign-in, reset and invite links are refused |
| 11 | Demote or deactivate the only admin | 409 `last_admin` |
| 12 | Password reset for an unknown email and for an active account (US5) | Same 202 response; only the active account gets an email; the link works once within 1 h; other sessions end |
| 13 | Log review | No passwords, tokens or reset/invite URLs in logs, Sentry or `security_events` |

Contracts: [contracts/auth.openapi.yaml](./contracts/auth.openapi.yaml). Data model: [data-model.md](./data-model.md).
