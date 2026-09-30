# Deployment decisions: everything on Vercel Hobby (free)

**Owner decision (2026-09-28):** this is a practice project. Both `web/` (Next.js) and `api/` (FastAPI) deploy to **Vercel Hobby (free)**. The AI uses the **Groq free tier**. Nothing paid is used without approval (see [COSTS.md](./COSTS.md)).

Vercel facts below were checked on 2026-09-28 against vercel.com/docs (Python runtime, FastAPI, Functions limits, Cron Jobs, Services). Re-verify before implementation.

## Platform facts that shape the plans

| Fact (Vercel Hobby) | Consequence |
|---------------------|-------------|
| FastAPI deploys as one Vercel Function, found through `[tool.vercel] entrypoint = "app.main:app"` in `api/pyproject.toml`. Streaming responses and lifespan events are supported. | SSE chat (008) and audit progress (009) work. The API is still its own deployable unit. |
| Functions are not always-on processes, and nothing guarantees work continues after the response is sent. | No FastAPI `BackgroundTasks` for important work, no in-process scheduler (APScheduler) and no in-memory rate limits. See D3–D5. |
| Maximum duration is 300 s. | Audits (90 s budget), chat (20 s) and proposal drafts (60 s) all fit within one request. |
| Request and response bodies are capped at **4.5 MB**. | 5 MB images (004) and 5 MB CVs (007) can't be posted through the API. See D6. |
| Cron jobs run **at most once per day**, with timing accurate to within about an hour. | Every scheduled job becomes daily. See D5. |
| No system packages are available in the Python runtime (only pip and uv packages). | WeasyPrint, which needs Pango, can't be used. See D7. |
| The Hobby plan is for non-commercial use only. | Accepted by the owner for a practice project. A real agency launch would need a paid plan, and asking for approval. |

## Decisions (these replace the conflicting parts of earlier plans)

- **D1. Two Vercel projects.** The `web` project has root `web/` (Next.js). The `api` project has root `api/` (FastAPI, Python 3.12, uv). Both run on Hobby.
  - **Alternative**: Vercel Services (beta) can run both in one project on one domain. It is not used while it is in beta.
- **D2. Same-origin API through Next.js rewrites, in every environment.** `web/next.config.ts` rewrites `/api/v1/:path*` to `${API_ORIGIN}/api/v1/:path*`, so the browser only ever talks to the web domain. As a result:
  - **Cookies**: the 003 session cookie is a host-only cookie on the web domain, with no `Domain` attribute; `*.vercel.app` preview domains work too.
  - **Server calls**: Server Components call `API_ORIGIN` directly, forwarding the cookie.
  - **CORS and CSRF**: CORS is no longer needed for browser traffic, although the allowlist is kept for safety. The CSRF Origin check compares against the web origin.
  - **Client IP**: comes from `x-forwarded-for`, using the first entry. **Verification task**: confirm the visitor's IP (not Vercel's) reaches the API through the rewrite. If it doesn't, per-IP limits fall back to the visitor id plus Turnstile.

  This **replaces** 001 research R3 (a direct browser call to `api.` with CORS) and 003 research R2 (a `.thebuzzcrew.com` cookie domain).
- **D3. Rate limits and counters in Postgres.** A single `rate_limit_hits (key_hash, kind, window_start, count)` table is incremented atomically with `INSERT … ON CONFLICT DO UPDATE … RETURNING count`. It replaces slowapi's in-memory storage (001 R5), which isn't shared between function instances. 003's `login_attempts` and 008's `visitor_usage` already follow this pattern, and `visitor_usage` is merged into `rate_limit_hits`.
- **D4. No "after the response" work.**
  - **Emails (001, 003, 006, 007, 009)**: sent **inline** after the database commit and before responding. The emails are sent concurrently, with a 5 s timeout each, and each outcome is recorded in `email_deliveries`. A failure never fails the request (001 FR-014). This adds roughly 0.3–1 s to form submissions.
  - **Lead priority (010)**: the create-lead response includes a one-time `post_process_token`. The browser then fires `POST /api/v1/leads/{id}/post-process` without waiting for it, in a separate function invocation that runs the Groq scoring. Leads that never get this call (for example, the tab closed) are scored by the daily cron (D5) or when an admin opens the lead. This keeps the scoring within the 1-minute target in normal use.
  - **Audits (009)**: `POST /api/v1/audits` streams Server-Sent Events (progress steps, then the result) and runs the whole audit inside that request, within 90 s. There is no job table or polling. If the connection drops, the audit either finishes and is stored, or is cancelled with nothing stored (FR-005). `GET /audits/{id}` remains for reloads and reuse.
- **D5. Scheduled jobs = Vercel Cron, daily.**
  - **Setup**: the `api` project's `vercel.json` defines one cron entry, `0 3 * * *`, which calls `GET /api/v1/internal/jobs/daily`, protected by the `CRON_SECRET` bearer token that Vercel sends. The handler runs every daily job in sequence, each under its own advisory lock.
  - **Jobs**: media cleanup (004), subscriber purge and closing expired roles (007), chat purge (008), audit purge (009), login-attempt pruning (003), Cloudinary temporary-upload cleanup (D6), and lead priority catch-up (010).
  - **More frequent jobs are dropped**: the 10-minute knowledge reindex (008) is removed, because chunks are already rebuilt in the same transaction as each publish, with the daily job as the safety net. The 15-minute lead priority retry (010) becomes: post-process call, then retry when an admin opens the lead, then the daily catch-up.
  - This **replaces** 010 research R0 (APScheduler).
- **D6. Large uploads go directly to Cloudinary, then are verified by the API.**
  1. **Signature**: `POST /api/v1/uploads/signature {usage}` returns a Cloudinary signed-upload signature for the `buzzcrew/{env}/tmp/` folder. It requires admin or editor for content images, and Turnstile plus the per-visitor limit for CVs. The signature restricts the upload with `allowed_formats` (jpg, png, webp, or pdf for CVs), and CVs use `type=authenticated`, `resource_type=raw`.
  2. **Upload**: the browser uploads the file directly to Cloudinary, so the 4.5 MB limit doesn't apply.
  3. **Finalise**: `POST /api/v1/uploads/finalize {public_id, usage}`. The API downloads the temporary file from Cloudinary and runs the **same checks as before**:
     - size of 5 MB or less, and the real type checked from the content;
     - for images: dimension warnings, and re-encoding to strip EXIF and GPS data;
     - for CVs: the `%PDF-` header and a `pypdf` open check.

     It then uploads the cleaned file to its final folder, deletes the temporary file and returns the media id. Rejected files are deleted immediately.
  4. **Cleanup**: temporary uploads that are never finalised are deleted by the daily cron.

  This **replaces** the multipart upload endpoints in 004 (`POST /admin/media`) and 007 (`cv` multipart field; the application now sends `cv_upload_id`). The user-facing rules and error messages are unchanged.
- **D7. Proposal PDFs with a pure-Python library.** The PDF path is Markdown → HTML (branded template) → PDF using **xhtml2pdf** (pure Python, built on ReportLab), which replaces WeasyPrint. DOCX stays on python-docx (pure Python).
- **D8. Database connections.** Use Neon's **pooled** connection string, and a SQLAlchemy engine with `pool_size=1`, `max_overflow=2` and `pool_pre_ping=True`, because Fluid compute reuses warm instances. Alembic migrations run from a developer machine or CI against the direct (unpooled) connection string, never during a function cold start.
- **D9. Logs.** Hobby keeps runtime logs for 1 hour. Structured JSON logs still go to stdout, and errors go to Sentry's free plan (feature 002) for longer retention.

## Constitution impact

The constitution's backend hosting line reads "Railway or Render (or an equivalent managed container platform)". Vercel Functions are not a container platform, so a **constitution amendment** is proposed: "Hosting: Vercel for web and api (practice project); a paid always-on host requires owner approval". Principle VIII (two deployable units) is still met, with two Vercel projects.
