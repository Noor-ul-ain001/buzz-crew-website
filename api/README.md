# The Buzz Crew API (FastAPI)

Python 3.12 (pinned in `.python-version`), managed with [uv](https://docs.astral.sh/uv/).

## Setup

```bash
cd api
cp .env.example .env          # fill in values (free tiers only; see ../specs/COSTS.md)
uv sync
uv run alembic upgrade head   # uses DATABASE_URL_DIRECT (Neon unpooled)
uv run uvicorn app.main:app --reload --port 8000
```

`uv` not on your PATH? Use `python -m uv …` instead.

## Checks

```bash
uv run ruff check . && uv run ruff format --check .
uv run pyright
uv run pytest
```

Tests never call Resend or any other third-party service; they use fakes. When
`TEST_DATABASE_URL` is empty, the tests start a throwaway local Postgres through
[pgserver](https://pypi.org/project/pgserver/) in `api/.pgdata/` (git-ignored).

## Deployment

Deployed as its own Vercel Hobby project with root `api/`. The entrypoint is
`app.main:app` (`[tool.vercel]` in `pyproject.toml`). See `../specs/DEPLOYMENT.md`.

## Admin accounts (feature 003)

Create the first admin once the database is migrated:

```sh
python -m uv run python -m app.cli create-admin --email you@example.com --name "Your Name"
```

Everyone else is invited from `/admin/users`. Prune old sign-in attempt rows with
`python -m uv run python -m app.jobs prune_login_attempts` (the daily cron calls it too).

`security_events` is append-only. On Neon, if the app connects with its own role, restrict it:

```sql
REVOKE UPDATE, DELETE, TRUNCATE ON security_events FROM app_role;
GRANT INSERT, SELECT ON security_events TO app_role;
```
