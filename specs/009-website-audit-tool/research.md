# Research: Free Website Audit Tool

> **Hosting update (2026-09-28):** the project runs entirely on Vercel Hobby. The decisions in [DEPLOYMENT.md](../DEPLOYMENT.md) take precedence over this file where they conflict. They are D4 (`POST /audits` streams progress and the result over SSE and runs the whole audit in that request, within 90 s; this replaces R4's job table, background task and polling) and D5 (the purge runs in the daily cron).

## R1. Measuring performance and SEO scores

- **Decision**: Google PageSpeed Insights API v5, `runPagespeed?url=…&strategy=mobile&category=performance&category=seo`, with the `PAGESPEED_API_KEY` key. From the response, the audit uses:
  - the performance and SEO category scores (× 100);
  - the LCP, INP (from field data when available, otherwise Total Blocking Time as the lab proxy) and CLS values;
  - the audits `viewport`, `font-size` and the tap- or target-size audit **if present in the Lighthouse version** (checked defensively by id).

  Timeout 60 s, with one retry on a 5xx response when time remains.
- **Rationale**: This gives standard, credible scores with a typical phone and connection profile (FR-007) without running headless Chrome on our server, which would be heavy and against Principle VIII.
- **Alternatives considered**: Self-hosted Lighthouse was rejected (it needs Chrome in the container, plus memory and time). Commercial SEO APIs were rejected on cost. **Verification task**: confirm which mobile tap-target audit id the current PSI Lighthouse version returns. If none, "tap targets" is reported as "not measured" rather than guessed.

## R2. HTML checks

- **Decision**: Our own fetch plus `selectolax`:
  - **Title**: present; length flagged below 10 or above 60.
  - **Meta description**: present; length flagged below 70 or above 160.
  - **Headings**: count of `h1` (flagged at 0 or more than 1); level skips (for example h2 → h4).
  - **Images**: count of `<img>` with a missing or empty `alt`, out of the total (excluding `role="presentation"` and `aria-hidden`). Zero images makes the check "Not applicable".
  - **Mobile**: from PSI `viewport` and `font-size`, plus our own viewport meta check as a fallback.

  Statuses are Passed, Needs work, Failed or Not applicable, using thresholds from `audit/thresholds.py` and documented in "How we check".
- **Rationale**: This meets FR-006 and FR-009 deterministically; the thresholds match those used on the agency's own site.

## R3. SSRF and abuse safety

- **Decision**:
  - **Normalise**: add `https://` when there is no scheme; allow only http and https, ports 80 and 443, and IDNA-encoded hosts.
  - **Resolve** all A and AAAA records, and reject if *any* is private, loopback, link-local, multicast, reserved, carrier-grade NAT, or the unique-local IPv6 range. Also reject IPv4-mapped IPv6 and decimal or octal encodings (after `ipaddress` parsing).
  - **Connect** only to the validated IP, using a custom `httpx` transport with `Host` and SNI preserved.
  - **Redirects**: follow them manually, repeating the checks at every hop (at most 5).
  - **Download**: stop at 2 MB (reported as "page too large", a speed issue); accept only `text/html` responses.
  - **Identify**: send `User-Agent: BuzzCrewAudit/1.0 (+https://www.thebuzzcrew.com/tools/seo-audit)`.
  - **Blocked detection**: 401, 403 or 429 responses, or known challenge pages, are reported as "the site blocks automated checks".
- **Rationale**: This meets FR-003, SC-009 and the probing edge case. PSI fetches the page from Google's side, so only our own fetch needs SSRF protection.

## R4. Job execution

- **Decision**: `POST /audits` inserts `audits(status=queued)` and schedules `runner.run(audit_id)` as a FastAPI background task. The runner claims the row with `UPDATE … WHERE status='queued' … RETURNING` (safe if replicas are added) and runs PSI and the HTML fetch concurrently (`asyncio.gather`) under a 90 s overall deadline, with the AI explanation last. On any failure it sets `status=failed` with a `failure_reason` and writes **no** report row (FR-005). The client polls `GET /audits/{id}` every 2 s and sees `status`, `step` and, when done, the report token.
- **Rationale**: This meets FR-004 without a queue service.
- **Alternatives considered**: Synchronous request-response was rejected: requests of 30–60 s are fragile through proxies and don't allow progress steps.

## R5. Grounded AI explanation

- **Decision**: Groq `chat.completions.create(model="openai/gpt-oss-20b", reasoning_effort="low", include_reasoning=False, max_completion_tokens=2000, response_format={"type": "json_schema", "json_schema": {"name": "audit_explanation", "strict": True, "schema": …}})` via 008's `ai/structured.py`, then re-validated with Pydantic. The input is only the structured results JSON: check ids, statuses, measured values and the placeholder names that are available. The Pydantic schema is `Explanation{fixes: list[Fix] (1–5)}`, where `Fix{check_id, what_is_wrong, why_it_matters, first_step}`. The prompt forbids digits and requires `{{placeholder}}` for any measured number. The validator requires:
  - each `check_id` has a status of `failed` or `needs_work`;
  - there are no duplicates;
  - the fix count is `min(5, max(1, issues))`, where zero issues produces a "what's working" message and no fixes;
  - there are no digits outside placeholders;
  - every placeholder is known;
  - there are no banned promise phrases (rank, guarantee, first page, double your traffic).

  The server then substitutes the measured values. If validation fails or the call times out (20 s), `fallback_texts[check_id]` is used and `explanation_source = fallback` is recorded.
- **Rationale**: This meets FR-010–FR-012 and SC-004 *by construction*: numbers cannot be invented because the model never writes them. Groq strict mode uses constrained decoding on GPT-OSS models, so the output matches the schema; our validator still checks the rules the schema can't express.

## R6. Per-website cache and visitor limits

- **Decision**:
  - **Site key**: `sha256(final registrable host + path)`. If a completed report for the same site key exists from the last 60 minutes, `POST /audits` returns that audit (`reused: true`) without re-running. Otherwise, if 10 audits already ran for that site key this hour, the latest is returned.
  - **Visitor limit**: 3 new audits per PKT day, keyed by `X-Visitor-Id` with an IP-hash fallback. Reused reports don't count.
  - **Bot protection**: a Turnstile token is required.
- **Rationale**: This meets FR-020–FR-022 and prevents the tool being used to hammer a third-party site.

## R7. Full report email and lead

- **Decision**: `POST /audits/{id}/report-request {name, email, business?, newsletter_opt_in, turnstile_token}`:
  1. It calls the 001 `lead_service.create_or_merge(source="website_audit", …)`: an open lead (status not won or lost) with the same email from the last 30 days gets the audit linked; otherwise a new lead is created with `services=[seo]`, `budget_range=not_sure` and a message such as "Requested website audit report for {host}".
  2. It links `audit_reports.lead_id`.
  3. It sends the report email (a background task, recorded in `email_deliveries`) and the team notification with the scores and admin link.
  4. If `newsletter_opt_in`, it calls 007's subscribe flow, which requires confirmation.

  The response includes the private report URL, which is shown on screen even if the email fails.
- **Rationale**: This meets FR-013–FR-019 and SC-005 (the email is sent only by this endpoint).

## R8. Report retention and the private link

- **Decision**: `audit_reports.token` is 256-bit URL-safe and unique, and the page is `/tools/seo-audit/{token}` with `robots: noindex, nofollow`. The `audit_report_opened` event is recorded. A daily purge deletes reports with `lead_id IS NULL` older than 90 days (and their audit rows). Linked reports follow lead retention (feature 002, pending).
- **Rationale**: This meets FR-016 and FR-024. The prototype's `[id]` route is renamed to use the token, so report ids are never exposed.
