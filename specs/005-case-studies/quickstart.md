# Quickstart: Case Studies

## Prerequisites

Features 001, 003 and 004 are running (Cloudinary and revalidation configured). Seed data:

```bash
cd api && uv run alembic upgrade head && uv run python -m app.cli seed-case-studies   # 6 published across 3 industries + 1 draft
```

## Test

```bash
cd api && uv run pytest tests/test_case_study_*.py
cd web && npx vitest run components/work && npx playwright test e2e/case-studies.spec.ts
```

## Validation scenarios

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Open `/work` on a phone (US4) | 6 cards in editor order; the draft is absent; filters show only industries and services with counts |
| 2 | Choose Healthcare & Dental, then SEO | Address becomes `/work?industry=healthcare-dental&service=seo`; only matches shown; result count announced |
| 3 | Copy that address into a private window (US5) | The same filters and results; Back returns to the previous filter state |
| 4 | Open `/work?industry=banana` | Unknown filter ignored; full list |
| 5 | View source of a filtered view | `<link rel="canonical" href=".../work">` and `noindex, follow` |
| 6 | Open a case study (US1) | Client, industry, country, services and headline metrics on the first screen; sections in order; no YouTube/Instagram requests until Play is pressed |
| 7 | Slider (US6): drag with a mouse, drag on touch, then keyboard (Arrow, Page Up, Home, End) | Divider moves; screen reader announces "Showing 70% before, 30% after"; vertical scroll works on touch |
| 8 | "Start a similar project" (US2) | Inquiry modal opens with the case study's services ticked; after submitting, the lead's `source_page` = `/work/{slug}` |
| 9 | Admin: publish with zero metrics (US3) | "Add at least one result before publishing" |
| 10 | Admin: Preview a draft, then open the preview URL signed out | Signed in: full preview with banner. Signed out: redirected to login, nothing shown |
| 11 | Admin: change a published slug | The old address returns 308 to the new one |
| 12 | Admin: unpublish | Within one request (and ≤ 5 min): detail page 404, removed from `/work`, facets, related lists and `sitemap.xml` |
| 13 | Lighthouse mobile on a case study with reels | SEO ≥ 90, Accessibility ≥ 90, LCP ≤ 2.5 s |

Contracts: [contracts/case-studies.openapi.yaml](./contracts/case-studies.openapi.yaml). Data model: [data-model.md](./data-model.md).
