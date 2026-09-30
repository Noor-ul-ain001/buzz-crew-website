# Quickstart: Blog, Industry Pages, Newsletter, FAQ, Careers and Theme

## Prerequisites

Features 001 and 003–006 are running. Seed data:

```bash
cd api && uv run alembic upgrade head && uv run python -m app.cli seed-content-hub
# 15 posts across categories (1 draft), tags incl. one with a single post, 3 industry pages, 10 FAQs (1 draft),
# 2 roles (1 open, 1 closed), sample fixtures: cv_ok.pdf, cv_fake.pdf (a renamed .docx), cv_big.pdf (6 MB)
```

## Test

```bash
cd api && uv run pytest tests/test_posts*.py tests/test_industry_pages.py tests/test_newsletter.py tests/test_careers.py
cd web && npx vitest run components/blog components/theme && npx playwright test e2e/blog.spec.ts e2e/newsletter.spec.ts e2e/careers.spec.ts e2e/faq.spec.ts e2e/a11y-themes.spec.ts
```

## Validation scenarios

| # | Scenario | Expected |
|---|----------|----------|
| 1 | `/blog` (US1) | 12 newest published posts, numbered pages; the draft absent |
| 2 | Open a post | Author, date, reading time, category, tags; table of contents on long posts; BlogPosting JSON-LD valid (0 errors) |
| 3 | `/blog/category/seo`, `/blog/tag/karachi` | Only matching posts; the single-post tag page has `noindex` and is absent from the sitemap |
| 4 | Admin: publish a 200-word post (US2) | Refused ("Body must be at least 300 words"); other missing items listed |
| 5 | Admin: publish a valid post, then change its slug | Appears within 5 minutes everywhere; the old slug returns 308 |
| 6 | End of an SEO post (US3) | 3 related posts; CTA opens the inquiry form with SEO pre-selected; newsletter signup shown |
| 7 | `/industries/restaurant-marketing-karachi` (US4) | Services, Food & Beverages case studies, industry FAQs, CTA; unpublish → 404 and gone from the sitemap |
| 8 | Subscribe a new email (US5) | "Check your inbox"; row `pending`; confirmation email with a link |
| 9 | Confirm via the link, click it again | `confirmed` with `confirmed_at`; second click shows the same thanks |
| 10 | Subscribe an already-confirmed email | Same on-screen message; no email sent; no duplicate |
| 11 | Unsubscribe link (no sign-in) | `unsubscribed` immediately; re-subscribe option shown |
| 12 | A pending row dated 31 days ago, run the purge job | Deleted |
| 13 | `/careers` (US6) | Only the open role listed; the closed role URL shows "no longer open" with `noindex` |
| 14 | Apply with `cv_fake.pdf` / `cv_big.pdf` | "needs to be a PDF" / "larger than 5 MB"; nothing stored |
| 15 | Apply with `cv_ok.pdf`; apply again with the same email | 201 plus confirmation email; second → "already applied" |
| 16 | Editor opens `/admin/applications`; anonymous `GET` the CV signed URL after 60 s | Editor: access denied, API 403. Expired URL: 401/404 from Cloudinary |
| 17 | `/faq` with the keyboard (US7) | Grouped topics; Enter/Space toggles; the draft FAQ is absent; FAQPage JSON-LD matches the visible items |
| 18 | Device set to dark, then switch to Light and reload (US8) | Starts dark with no flash; Light persists across pages and visits |
| 19 | axe `color-contrast` on home, blog post, service page, contact and admin leads in both themes | 0 violations |

Contracts: [contracts/content-hub.openapi.yaml](./contracts/content-hub.openapi.yaml). Data model: [data-model.md](./data-model.md).
