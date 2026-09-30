# Quickstart: Free Website Audit Tool

## Prerequisites

Features 001, 003, 007 (newsletter) and 008 (`api/app/ai/`) are in place. Additional `api/.env`:

```text
PAGESPEED_API_KEY=<Google Cloud API key restricted to the PageSpeed Insights API>
AUDIT_UNLINKED_RETENTION_DAYS=90
```

Fixture site for local checks: `uv run python -m app.audit.fixtures_server` serves known-good and known-bad pages on `http://localhost:8765`. In tests only, it is allowed through a test-only allowlist override; production never allows loopback.

## Test

```bash
cd api && uv run pytest tests/test_audit_*.py tests/test_url_safety.py   # PSI, Groq, Resend mocked
cd web && npx playwright test e2e/seo-audit.spec.ts
```

## Validation scenarios

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Audit `example-client.com` on a phone (US1) | Progress steps announced; within 60 s: two scores with labels, ≤ 5 top issues, audited URL and time, "home page only" note |
| 2 | Each check on the bad fixture page (US2) | Title "Failed (missing)", description "Needs work (182 characters)", headings "Failed (no main heading, h2→h4)", alt "5 of 12 images missing", mobile and speed from PSI |
| 3 | Page with no images | Image check "Not applicable" |
| 4 | Explanation (US3) | 3–5 fixes, each tied to a failed or needs-work check; every number matches `measured`; labelled AI-generated; no promises |
| 5 | Fake model returns digits or a passed check | Rejected; fallback explanation shown; `explanation_source=fallback` |
| 6 | `my shop`, `ftp://x`, `http://127.0.0.1`, `http://169.254.169.254`, a domain resolving to 10.0.0.5, a redirect to localhost | Clear errors; no fetch to internal addresses; no report rows |
| 7 | Unreachable domain / 45 s PSI hang beyond the deadline | "We couldn't reach…" / "took too long"; no partial report |
| 8 | 4th audit today | Limit message with reset time and contact invitation |
| 9 | Same site audited again within the hour | Existing report returned (`reused`), not counted |
| 10 | Complete an audit without requesting the report | No email sent to anyone (SC-005) |
| 11 | Request the full report (US4) | On-screen link; email within 2 minutes with all checks and fixes; lead `source=website_audit` with scores and report link; team notified (US5) |
| 12 | Request again with the same email within 30 days | Report added to the same lead (no duplicate) |
| 13 | Open the private link signed out; view source | Full report; `noindex`; the token is not guessable |
| 14 | Editor requests an audit lead or report in admin | 403 |
| 15 | Purge job on a 91-day unlinked report | Deleted; linked reports kept |

Contracts: [contracts/audits.openapi.yaml](./contracts/audits.openapi.yaml). Data model: [data-model.md](./data-model.md).
