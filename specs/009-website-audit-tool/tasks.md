---
description: "Task list for 009 Free Website Audit Tool"
---

# Tasks: Free Website Audit Tool

**Input**: `specs/009-website-audit-tool/` (plan, spec, research, data-model, contracts/audits.openapi.yaml, quickstart), plus `specs/DEPLOYMENT.md`

**Prerequisites**:
- 001: leads, email, limits.
- 003: roles.
- 007: newsletter subscribe flow.
- 008: `api/app/ai/client.py`, `ai/structured.py`, `ai_usage_daily`.

**Deployment note**: `POST /audits` runs the whole audit inside the request and **streams progress over SSE**, within 90 s (DEPLOYMENT D4; research R4's job table and polling are superseded). The purge runs in the daily cron (D5).

**Cost note**: the PageSpeed Insights API is free with a key, and Groq is on the free tier.

**Tests**: Included. PSI, Groq and Resend are faked in every test.

---

## Phase 1: Setup

- [ ] T001 Create branch `009-website-audit-tool`; add `selectolax` to `api/pyproject.toml`; add `PAGESPEED_API_KEY` and `AUDIT_UNLINKED_RETENTION_DAYS=90` to `api/.env.example`
- [ ] T002 [P] Create the HTML fixture pages in `api/tests/fixtures/audit/`: `good.html`, `bad.html` (no title, a 182-character description, no h1, an h2→h4 skip, 5 of 12 images without alt, no viewport), `no_images.html`, and `huge.html` (larger than 2 MB, generated); and `api/tests/fakes/pagespeed.py` (a canned PSI v5 JSON with category scores, LCP, INP or TBT, CLS, `viewport` and `font-size` audits; slow and error modes)

---

## Phase 2: Foundational

- [ ] T003 Create the models in `api/app/models/audit.py` per data-model.md, with an Alembic migration:
  - **`audits`**: `entered_url` varchar(500); `final_url` varchar(500) nullable; `site_key` char(64) "sha256(host + path)"; `status` enum (`queued`,`running`,`completed`,`failed`); `step` enum (`fetching`,`checking_seo`,`measuring_speed`,`explaining`) nullable; `failure_reason` enum (the 9 values in data-model.md) nullable; `visitor_key_hash`; `ip_hash`; `reused_from_id`; `started_at`; `finished_at`.
  - **`audit_reports`**: `audit_id` unique; `token` char(43) unique; `performance_score` and `seo_score` smallint 0–100; `checks`, `top_issues` and `explanation` jsonb; `explanation_source` enum (`ai`,`fallback`); `lead_id` nullable; `delete_after`; `created_at`.
- [ ] T004 Implement `api/app/audit/url_safety.py`:
  - normalise the URL (add `https://` when there is no scheme; allow only http and https, ports 80 and 443; IDNA-encode the host);
  - resolve all A and AAAA records and reject private, loopback, link-local, multicast, reserved and CGNAT ranges, `fc00::/7`, IPv4-mapped IPv6, and decimal or octal forms;
  - provide a pinned-IP `httpx` transport that preserves Host and SNI;
  - follow redirects manually, re-checking every hop, up to 5.
- [ ] T005 [P] Tests in `api/tests/test_url_safety.py`: `my shop` → `invalid_url`; `ftp://x`; `http://127.0.0.1`; `http://[::1]`; `http://2130706433`; `http://169.254.169.254`; a host resolving to 10.0.0.5 (DNS mocked); a redirect chain ending at localhost; 6 redirects → `too_many_redirects`. Each is refused **before any connection** to an internal address.

---

## Phase 3: User Story 1 – Audit a site and see the summary (P1) 🎯 MVP

**Goal**: Enter a URL and, within about 60 s, see streamed progress, two scores and the top issues.

**Independent Test**: With the fakes, `POST /api/v1/audits` streams `step` events, then `done` with the scores (labelled Good, Needs work or Poor), up to 5 top issues, the final URL, the audit time and the "home page only" note. Failures stream `failed` with a plain-language message, and no report row exists.

- [ ] T006 [P] [US1] Tests in `api/tests/test_audit_run.py`:
  - the happy path stream order;
  - the 90 s deadline gives `failed{timeout}` and no `audit_reports` row;
  - unreachable, http_error, blocked_by_site (401, 403, 429 or a challenge page), not_html and a page over 2 MB each map to their failure reason and message;
  - a report is written only on completion;
  - the page HTML is not stored anywhere (only the report fields).
- [ ] T007 [P] [US1] Tests in `api/tests/test_audit_limits.py`:
  - 3 new audits per visitor per PKT day, then 429 `audit_limit_reached` with `reset_at` (via `rate_limit_hits` kind `audit_visitor`);
  - the same `site_key` within 60 minutes reuses the report (`reused=true`, not counted);
  - more than 10 audits per site per hour returns the latest;
  - Turnstile failure returns 400.
- [ ] T008 [US1] Implement `api/app/audit/fetch_html.py`: a GET through the safe transport with `User-Agent: BuzzCrewAudit/1.0 (+https://www.thebuzzcrew.com/tools/seo-audit)`, a 15 s timeout, a 2 MB streaming cap, `text/html` only, and blocked-site detection
- [ ] T009 [US1] Implement `api/app/audit/pagespeed.py`: PSI v5 `strategy=mobile&category=performance&category=seo` with a 60 s timeout and one retry on 5xx when time allows; parse only the fields used into Pydantic models; tap-target or target-size audits are optional by id (reported as "not measured" when absent)
- [ ] T010 [US1] Implement `api/app/audit/runner.py`:
  - `run(audit, emit)`: PSI and the HTML fetch concurrently (`asyncio.gather`) under a 90 s deadline, then checks, top issues (ordered by impact) and the explanation (US3);
  - emits the steps `fetching`, `checking_seo`, `measuring_speed` and `explaining`;
  - writes `audit_reports` with a 43-character token only on success; otherwise sets `failed`.
- [ ] T011 [US1] Implement `api/app/routers/audits.py`: `POST /api/v1/audits` (Turnstile, limits, per-site reuse, then an **SSE stream** through sse-starlette) and `GET /api/v1/audits/{id}` (status and result for reloads), per `contracts/audits.openapi.yaml`
- [ ] T012 [US1] Wire `web/components/seo-audit/SeoAuditTool.tsx` and `AuditResults.tsx` (existing prototypes):
  - URL input with inline validation;
  - SSE progress steps announced in a live region;
  - score dials with a text label, not colour alone;
  - top issues, the audited URL and time, and the "home page only" note;
  - failure messages with a suggestion; the limit message with the reset time and contact CTA;
  - a CTA for the full report or to talk to the team.

  Remove `web/lib/seo-audit/audit.ts` mock data (keep `DAILY_AUDIT_LIMIT=3` in shared config).

---

## Phase 4: User Story 2 – The six checks (P1)

**Goal**: Title, description, headings, image alternative text, mobile and speed checks, each with a status and one sentence.

**Independent Test**: `bad.html` produces title "Failed (missing)", description "Needs work (182 characters)", headings "Failed (no main heading, h2→h4)", images "5 of 12 missing", plus mobile and speed from the PSI fake; `no_images.html` gives the image check "Not applicable".

- [ ] T013 [P] [US2] Tests in `api/tests/test_audit_checks.py`:
  - **Title**: flagged if missing, under 10 or over 60 characters.
  - **Description**: flagged if missing, under 70 or over 160 characters.
  - **Headings**: h1 count of 0 or more than 1; level skips.
  - **Images**: `images_missing_alt / images_total`, excluding `role="presentation"` and `aria-hidden`; zero images is `not_applicable`.
  - **Mobile**: PSI `viewport` and `font-size`, falling back to our own viewport meta check.
  - **Speed**: LCP, INP (or TBT) and CLS against the thresholds.
  - Each status is `passed`, `needs_work`, `failed` or `not_applicable`, with a one-sentence summary.
- [ ] T014 [US2] Implement `api/app/audit/thresholds.py` (documented constants for the "How we check" text) and `api/app/audit/checks.py` (selectolax parsing into `CheckResult{id, status, summary, measured, detail}`)
- [ ] T015 [US2] Render the six checks with status icons and text in `web/components/seo-audit/AuditResults.tsx`

---

## Phase 5: User Story 3 – Plain-language fixes grounded in measurements (P1)

**Goal**: A 3–5 fix explanation where every number is a measured value.

**Independent Test**: With FakeGroq returning placeholders, the rendered fixes contain only measured numbers. Output with digits, a passed check id or an unknown placeholder is rejected and the fallback text is shown (`explanation_source=fallback`).

- [ ] T016 [P] [US3] Tests in `api/tests/test_audit_explain.py`:
  - the strict schema `Explanation{fixes: 1–5 × {check_id, what_is_wrong, why_it_matters, first_step}}`;
  - the validator rejects a passed `check_id`, duplicates, the wrong count (`min(5, max(1, issues))`), digits outside `{{…}}`, unknown placeholders, and the banned phrases "rank", "guarantee", "first page" and "double your traffic";
  - placeholders are substituted with measured values;
  - zero issues gives `working_well` text and no fixes;
  - a Groq timeout (20 s) or error uses the fallback.
- [ ] T017 [US3] Implement `api/app/audit/explain.py`: build the input from structured results only (check ids, statuses, measured values, available placeholder names); call `ai/structured.generate(STRUCTURED_MODEL, Explanation, …)` with `reasoning_effort="low"` and `include_reasoning=False`; validate; substitute; fall back
- [ ] T018 [P] [US3] Write `api/app/audit/fallback_texts.py`: an agency-written what, why and first-step text for each check id and status, with `{{placeholders}}`
- [ ] T019 [US3] Render the fixes with an "AI-generated" label (or no label when it's the fallback) and no promises, in `web/components/seo-audit/AuditResults.tsx`

---

## Phase 6: User Story 4 – Full report by email (P2)

**Goal**: Name and email in exchange for the full report plus a private link; emails only on request.

**Independent Test**: Completing an audit without the form sends 0 emails. Submitting the form sends one email with every check's details and a private link that is `noindex`; if the email fails, the link is still shown on screen.

- [ ] T020 [P] [US4] Tests in `api/tests/test_audit_report_request.py`:
  - no email without a request (SC-005);
  - `POST /audits/{id}/report-request` sends the email with the full details and token link, inline (D4), recorded in `email_deliveries` (kind `audit_report`);
  - an email failure still returns 201 with `report_url`;
  - `newsletter_opt_in=true` calls the 007 subscribe flow (pending plus confirmation);
  - an incomplete audit returns 409;
  - `GET /api/v1/reports/{token}` returns the full report; an unknown token returns 404.
- [ ] T021 [US4] Implement the report-request endpoint and `GET /api/v1/reports/{token}` in `api/app/routers/audits.py`, and the templates `api/app/templates/email/audit_report.{html,txt}` (scores, each check with details and how to fix, "How we check", private link)
- [ ] T022 [US4] Create the report-request form in `web/components/seo-audit/ReportRequestForm.tsx` (name required, email required, business optional, the contact notice, privacy link, an unticked newsletter opt-in, Turnstile) and move the report page to `web/app/(site)/tools/seo-audit/[token]/page.tsx` (`robots: noindex, nofollow`), tracking `audit_report_opened`

---

## Phase 7: User Story 5 – Audit leads reach the agency (P2)

**Goal**: Leads with source `website_audit`, scores and the report link; merged within 30 days.

**Independent Test**: A report request creates a lead (`status=new`, `source=website_audit`, audited URL, scores, report link) and the team notification. A second request with the same email within 30 days attaches to the same open lead. Editors are refused.

- [ ] T023 [P] [US5] Tests in `api/tests/test_audit_leads.py`: lead fields as above (`services=[seo]`, `budget_range=not_sure`, message "Requested website audit report for {host}"); merging into an open lead (not won or lost) from the last 30 days; the team notification includes the scores and admin link; an editor gets 403 on `GET /api/v1/admin/audit-reports/{id}`
- [ ] T024 [US5] Add `lead_service.create_or_merge(source="website_audit", …)` in `api/app/services/lead_service.py` (001), link `audit_reports.lead_id`, and add the admin-only `GET /api/v1/admin/audit-reports/{id}` in `api/app/routers/audits.py`

---

## Phase 8: Polish

- [ ] T025 [P] Implement `purge_audits()` in `api/app/jobs/audit_jobs.py` (delete reports with `lead_id IS NULL` older than 90 days, and their audits) for the daily cron (D5)
- [ ] T026 [P] Track `audit_started`, `audit_completed`, `audit_failed{reason}`, `audit_limit_reached`, `audit_report_requested` and `audit_report_opened` in `web/lib/analytics.ts`
- [ ] T027 [P] Playwright test in `web/e2e/seo-audit.spec.ts` (API mocked: stream to results to report request) and an axe check of the tool page
- [ ] T028 Run quickstart scenarios 1–15 on the Vercel Hobby preview (check that SSE passes through the web → api rewrite and that a real PSI call finishes within 60 s); record the PSI tap-target audit id finding in `research.md` R1

## Dependencies

- **Order**: Setup → Foundational → US1 → US2 (the checks feed the US1 summary; build them together if preferred) → US3 → US4 → US5 → Polish.

## Implementation strategy

**MVP**: US1 + US2 + US3 (a useful free tool). Then US4 + US5 (lead capture).
