# Data Model: Secure Admin Access and Team Roles

All timestamps are UTC timezone-aware. Hashes are hex SHA-256 unless noted.

## Enums

| Enum | Values |
|------|--------|
| `user_role` | `admin`, `editor` (feature 011 adds `client`) |
| `user_status` | `invited`, `active`, `deactivated` |
| `session_end_reason` | `signed_out`, `idle`, `max_age`, `deactivated`, `password_changed`, `role_changed_forced` |
| `security_event_type` | `login_succeeded`, `login_failed`, `logout`, `lockout`, `password_reset_requested`, `password_reset_completed`, `password_changed`, `invitation_sent`, `invitation_accepted`, `invitation_cancelled`, `role_changed`, `user_deactivated`, `user_reactivated`, `access_denied` |

## `users`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `email` | varchar(254) | Unique on `lower(email)`; stored lower-cased |
| `name` | varchar(100) | Required |
| `password_hash` | varchar(255), nullable | Argon2id; null while `invited` |
| `role` | `user_role` | Required |
| `status` | `user_status` | Default `invited` |
| `last_login_at` | timestamptz, nullable | |
| `created_at`, `updated_at` | timestamptz | |

**Transitions**: `invited → active` (invitation accepted), `active ↔ deactivated` (admin). Guard: at least one `active` + `admin` must always exist (FR-023).

## `sessions`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | ON DELETE CASCADE |
| `token_hash` | char(64) | Unique index; the token itself is never stored |
| `created_at` | timestamptz | Absolute expiry = created_at + 12 h |
| `last_seen_at` | timestamptz | Idle expiry = last_seen_at + 30 min; written at most once per minute |
| `ended_at` | timestamptz, nullable | |
| `end_reason` | `session_end_reason`, nullable | |
| `ip_hash`, `user_agent_family` | varchar | For the security record; no raw IP |

**Valid session** = `ended_at IS NULL AND now() < created_at + 12h AND now() < last_seen_at + 30min AND user.status = 'active'`.

## `invitations`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `email` | varchar(254) | lower-cased |
| `role` | `user_role` | |
| `user_id` | UUID FK → users | The `invited` user row created at invite time |
| `invited_by` | UUID FK → users | |
| `token_hash` | char(64) | Unique |
| `expires_at` | timestamptz | created + 72 h |
| `accepted_at`, `cancelled_at` | timestamptz, nullable | Single use |
| `created_at` | timestamptz | |

**States**: pending → accepted | expired (derived) | cancelled. Resending creates a new row and cancels the previous one.

## `password_resets`

| Column | Type | Rules |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | |
| `token_hash` | char(64) | Unique |
| `expires_at` | timestamptz | created + 1 h |
| `used_at` | timestamptz, nullable | Also set when superseded by a newer request or a password change |
| `created_at` | timestamptz | |

## `login_attempts`

| Column | Type | Rules |
|--------|------|-------|
| `id` | bigint PK | |
| `email_hash` | char(64) | sha256(lower(email)), even for unknown emails |
| `ip_hash` | char(64) | sha256(ip + server salt) |
| `kind` | varchar(20) | `login_failed`, `reset_request`, `invite_request` |
| `attempted_at` | timestamptz | Indexed with each hash |

Rows older than 24 hours are pruned daily.

## `security_events` (append-only)

| Column | Type | Rules |
|--------|------|-------|
| `id` | bigint PK | |
| `type` | `security_event_type` | |
| `user_id` | UUID, nullable | The account concerned |
| `actor_id` | UUID, nullable | The team member who acted (for admin actions) |
| `ip_hash` | char(64), nullable | |
| `detail` | jsonb | Non-sensitive context, for example `{ "from_role": "admin", "to_role": "editor", "path": "/api/v1/leads" }`; never passwords, tokens or links |
| `created_at` | timestamptz | Retained ≥ 12 months; the database role has INSERT/SELECT only |

## Relationships

`users 1─* sessions`, `users 1─* password_resets`, `users 1─1 invitations` (current), `users 1─* security_events` (as subject or actor).

## Permission matrix (enforced by `require_role`)

| Area (API prefix) | admin | editor |
|-------------------|-------|--------|
| `/api/v1/admin/content/*` (features 004, 005, 007) | ✔ | ✔ |
| `/api/v1/leads/*`, `/api/v1/admin/applications/*`, `/api/v1/admin/subscribers/*` | ✔ | ✘ 403 |
| `/api/v1/users/*`, `/api/v1/invitations` | ✔ | ✘ 403 |
| `/api/v1/admin/settings/*` | ✔ | ✘ 403 |
| `/api/v1/auth/me`, `/logout`, `/session/extend`, `/password/change` | ✔ | ✔ |
