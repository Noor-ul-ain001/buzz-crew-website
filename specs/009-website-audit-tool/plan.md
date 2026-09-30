# Implementation Plan: Free Website Audit Tool

**Branch**: `009-website-audit-tool` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-website-audit-tool/spec.md`

## Summary

The audit is backend-driven, with an AI explanation grounded only in measured data.

**Starting an audit**: `POST /api/v1/audits` validates and normalises the URL and applies these safeguards:
- **SSRF protection**: DNS resolution with private, loopback, link-local and reserved ranges blocked, re-checked on every redirect, with the connection pinned to the checked IP.
- **Limits**: Turnstile, 3 audits per visitor per day, and 10 audits per website per hour. A request over the website limit returns the latest report from the last hour.

**Running an audit**: `POST /audits` runs the whole audit inside the request and streams progress and the result over Server-Sent Events (DEPLOYMENT D4; there is no job table or polling). It runs two steps concurrently:
- **Google PageSpeed Insights (mobile)** for the performance and SEO scores, Core Web Vitals and the mobile-friendliness audits.
- **Our own HTML fetch**: `httpx` with a 2 MB size cap, 15 s timeout and at most 5 redirects, parsed with `selectolax` for the title, meta description, heading structure and image alternative text. The HTML is discarded afterwards.

**Results**:
- Six check results and the top 5 issues are computed deterministically.
- **AI explanation**: Groq `openai/gpt-oss-20b` (strict json_schema structured output via 008's `ai/structured.py`, then re-validated by Pydantic) writes the 3–5 fixes. It refers to measured values only through **placeholders** that the server fills in (for example `{{title_length}}`), so every number shown is a measured value. A validator rejects references to checks that passed and any unknown placeholders. If generation fails, the agency's pre-written explanation for each check is used instead.
- A report is stored only for a completed audit; failures store an outcome code and nothing else.

**Full report and lead**: `POST /audits/{id}/report-request` captures name and email, creates or merges a lead (`source = website_audit`) through the 001 lead service, and emails the full report through Resend. Report pages use a private, unguessable token and are `noindex`.

## Technical Context

**Language/Version**: TypeScript 5 strict / Next.js 16.3; Python 3.12+

**Primary Dependencies**:
- **api**: `httpx`, `selectolax`, the PageSpeed Insights API v5 (HTTPS, API key), `groq` (via 008's `ai/client.py` and `ai/structured.py`), FastAPI, SQLModel
- **web**: the existing `SeoAuditTool` and `AuditResults` prototypes, `/tools/seo-audit/[id]`

**Storage**: Neon Postgres (`audits`, `audit_reports`; `visitor_usage` kinds `audit_visitor`, `audit_site`)

**Testing**:
- pytest, with PSI, Groq and Resend mocked and fixture HTML pages:
  - SSRF blocking, including DNS rebinding through a redirect to 127.0.0.1, `file:` and `ftp:` schemes, IPv6 loopback and decimal-encoded IPs;
  - invalid and unreachable URLs and timeouts, size cap, non-HTML content types;
  - each check on known-bad fixtures; image check "not applicable";
  - placeholder validation and rejection of unknown placeholders; fallback explanation;
  - the per-site cache and per-visitor limit; no partial report on failure;
  - lead creation and merging, email only after a request, and editor 403.
- Playwright: happy path with a mocked API.

**Target Platform**: Vercel Hobby (free) for both the `web` and `api` projects (practice project), Google PSI API, Groq API — see [DEPLOYMENT.md](../DEPLOYMENT.md) and [COSTS.md](../COSTS.md)

**Project Type**: Web application (`web/` + `api/`)

**Performance Goals**: 90% of audits finish within 60 s, with PSI dominating (typically 15–40 s) and running in parallel with the HTML fetch. The hard stop is 90 s. Polling is every 2 s.

**Constraints**:
- One page per audit.
- Mobile-only measurement.
- No page content stored beyond report fields.
- Reports not linked to a lead are deleted after 90 days.
- Emails are sent only after the visitor submits the report request.

**Scale/Scope**: Tens of audits per day; each audit is one streamed request of 90 s or less (within Vercel's 300 s limit).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-driven | No open markers. Lead retention follows feature 002, still open, and is configured. | ✅ Pass |
| II. SEO & performance | `/tools/seo-audit` is server-rendered with a client island; report pages are `noindex` | ✅ Pass |
| III. Contract-first | [contracts/audits.openapi.yaml](./contracts/audits.openapi.yaml) | ✅ Pass |
| IV. Test-first | SSRF and grounding tests are first-class | ✅ Pass |
| V. Security & privacy | SSRF controls; the report token is 256-bit; audit leads are admin-only; page HTML is not stored; no PII in events | ✅ Pass |
| VI. Type safety | Pydantic for PSI response parsing (only the fields used) and the AI output | ✅ Pass |
| VII. Accessible | Progress announced in a live region; scores as text as well as colour; keyboard-operable | ✅ Pass |
| VIII. Simplicity | Jobs in a database table plus an in-process runner (no queue service); one parser library | ✅ Pass. A single API replica is assumed, as in 001, with the job-table claim designed to be safe with more. |
| IX. Responsible AI | Backend only (Groq; no Claude API); grounded via placeholders; validated output; fallback text; labelled AI-generated; timeouts (20 s) and the daily spend cap (008's `ai_usage_daily`) | ✅ Pass |
| X. Observability | Events `audit_started`, `audit_completed`, `audit_failed{reason}`, `audit_limit_reached`, `audit_report_requested`, `audit_report_opened` | ✅ Pass |

**Post-design re-check**: Pass.

## Project Structure

### Documentation (this feature)

```text
specs/009-website-audit-tool/
├── plan.md  research.md  data-model.md  quickstart.md
└── contracts/audits.openapi.yaml
```

### Source Code

```text
api/app/
├── audit/url_safety.py        # normalise, resolve, block private ranges, pinned transport, redirect re-check
├── audit/fetch_html.py        # capped fetch (2 MB, 15 s, ≤5 redirects, text/html only)
├── audit/checks.py            # title, description, headings, alt, (mobile + speed from PSI) → CheckResult
├── audit/pagespeed.py         # PSI v5 client (strategy=mobile, categories performance+seo)
├── audit/explain.py           # Groq structured output → placeholders → validate → render; fallback texts
├── audit/fallback_texts.py    # agency-written explanation per check
├── audit/runner.py            # job claim (SELECT … FOR UPDATE SKIP LOCKED), orchestration, 90 s deadline
├── models/audit.py            # Audit, AuditReport
├── routers/audits.py          # POST /audits, GET /audits/{id}, POST /audits/{id}/report-request, GET /reports/{token}
├── templates/email/audit_report.{html,txt}
└── jobs/purge_audits.py       # delete unlinked reports > 90 days
web/
├── app/(site)/tools/seo-audit/page.tsx          # existing
├── app/(site)/tools/seo-audit/[token]/page.tsx  # existing [id] route renamed to token; noindex
└── components/seo-audit/*                       # existing prototypes → SSE progress client, report-request form
```

**Structure Decision**: This extends `web/` + `api/`. Audit logic is isolated in `api/app/audit/`, and the AI client, usage accounting and guards come from 008's `api/app/ai/`.

## Complexity Tracking

No violations.
