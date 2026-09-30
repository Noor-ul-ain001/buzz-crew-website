# Implementation Plan: Blog, Industry Pages, Newsletter, FAQ, Careers and Theme

**Branch**: `007-blog-content-hub` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-blog-content-hub/spec.md`

## Summary

This feature has eight independently deliverable parts. All of them reuse feature 004's publishing pattern (PublishableMixin, publish rules, media, activity log, revalidation webhook) and 001's form conventions (Turnstile, rate limits, background emails with delivery records).

**Blog**:
- `posts` hold restricted Markdown bodies. Reading time is computed on save, and the table of contents comes from headings.
- Categories are a fixed enum: the five services plus `agency_news`. Tags are normalised.
- Authors are published team members (004). Old slugs redirect.
- Routes are `/blog`, `/blog/[slug]`, `/blog/category/[slug]` and `/blog/tag/[slug]`, statically generated with tag revalidation. Each has Article (BlogPosting) and Breadcrumb JSON-LD, related posts, and an end-of-post call to action plus newsletter signup.
- Tag pages with fewer than 2 posts are `noindex` and left out of the sitemap.

**Industry pages**: `industry_pages` at `/industries/[slug]`, where the slug includes the industry and location. They pull case studies by case-study industry or from a hand-picked list (up to 6), and FAQs through `faqs.industries` from feature 006. Structured data uses WebPage + Service + Breadcrumb, as the spec's assumption decided.

**Newsletter**: `subscribers` with double opt-in:
- confirmation tokens are hashed and expire after 7 days, and unconfirmed sign-ups are purged after 30 days;
- one-click unsubscribe, with an identical response whatever the email's state;
- Turnstile, a per-IP limit, and at most 3 confirmation emails per address per day.

**FAQ**: the public `/faq` page over 006's `faqs` table, grouped by topic, using native `<details>` accordions and FAQPage JSON-LD.

**Careers**:
- `job_roles` (Draft, Published or Closed, with an optional closing date) and `job_applications`.
- CVs are checked to be real PDFs of up to 5 MB and are stored privately in Cloudinary's authenticated storage. Only admins can download them, through 60-second signed URLs.
- Each email address can apply once per role. Closed roles show a `noindex` "no longer open" page.

**Theme**: `next-themes` (already installed) with Light, Dark and System. Colours come from CSS variable tokens for both themes and are verified with axe contrast checks.

## Technical Context

**Language/Version**: TypeScript 5 strict / Next.js 16.3; Python 3.12+

**Primary Dependencies**:
- **web** (all already installed except the last two): `react-markdown`, `remark-gfm`, `rehype-slug`, `github-slugger`, `@tailwindcss/typography`, `next-themes`, `next/og`, `@axe-core/playwright`, `@marsidev/react-turnstile`
- **api**: SQLModel, the 004 services, `pypdf` (PDF structure check), `cloudinary` (authenticated raw uploads), `python-slugify`

**Storage**: Neon Postgres. New tables: `posts`, `tags`, `post_tags`, `post_slug_history`, `industry_pages`, `industry_page_case_studies`, `subscribers`, `job_roles`, `job_applications`. Cloudinary is used for public images and for private CVs.

**Testing**:
- pytest:
  - post publish rules (at least 300 words, cover image alternative text, alternative text for body images, author, category), reading time, tag normalisation, slug redirects;
  - industry-page case-study selection;
  - the double opt-in flow, expiry, purge, the identical-response check and unsubscribe;
  - CV sniffing and oversize rejection, private-CV access (anonymous and editor get 401/403), one application per role;
  - closed-role visibility and draft invisibility everywhere.
- Vitest: table of contents, Markdown allowlist, theme switch.
- Playwright: read and filter posts, subscribe (with a mocked email provider), apply for a job with a PDF, FAQ keyboard use, and axe checks in both themes.

**Target Platform**: Vercel Hobby (free) for both the `web` and `api` projects (practice project) — see [DEPLOYMENT.md](../DEPLOYMENT.md) and [COSTS.md](../COSTS.md)

**Project Type**: Web application (`web/` + `api/`)

**Performance Goals**: Posts and industry pages are statically generated and meet Core Web Vitals (LCP ≤ 2.5 s mobile). Public list endpoints p95 < 150 ms. A theme switch causes no layout shift or flash.

**Constraints**:
- **Posts**: body of at least 300 words; excerpt up to 200 characters; SEO title up to 60 and description up to 160; 0–8 tags; 12 posts per page.
- **Newsletter**: confirmation links last 7 days, unconfirmed sign-ups are purged after 30 days, and each address gets at most 3 confirmation emails per day.
- **Careers**: CV must be a PDF of up to 5 MB; cover note up to 1,500 characters.
- **Themes**: WCAG AA contrast in both.

**Scale/Scope**: Tens to hundreds of posts, about 10 industry pages, tens of FAQs, a few roles at a time, and hundreds to thousands of subscribers.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-driven | No open markers. The spec's deliberate deviation (industry pages don't use Article markup) is recorded. Depends on 001 and 003–006 (planned). The applications retention period is pending feature 002's open question and is configured, not hard-coded. | ✅ Pass |
| II. SEO & performance | SSG/ISR, unique metadata, Article/JobPosting/FAQPage/Breadcrumb JSON-LD, crawlable numbered pagination, thin tag pages `noindex`, sitemap limited to published items | ✅ Pass |
| III. Contract-first | [contracts/content-hub.openapi.yaml](./contracts/content-hub.openapi.yaml) | ✅ Pass |
| IV. Test-first | Tests listed above are written first; the double opt-in and CV access control are critical paths | ✅ Pass |
| V. Security & privacy | Applicants and subscribers are admin-only; CVs are private with signed short-lived URLs and never on a public URL; Markdown uses an allowlist; enumeration-safe newsletter responses; Turnstile and rate limits | ✅ Pass |
| VI. Type safety | Generated types; Zod search params; Pydantic everywhere | ✅ Pass |
| VII. Accessible | `<details>` accordions, labelled forms, accessible theme switch, axe in both themes, reduced motion respected | ✅ Pass |
| VIII. Simplicity | Categories as an enum rather than a table; no search engine; no newsletter-sending service (sending is out of scope); reuses 004 and 006 | ✅ Pass |
| IX. AI | N/A. FAQs are stored as structured, self-contained entries for 008's retrieval. | N/A |
| X. Observability | Events `post_viewed`, `blog_filter_used`, `post_cta_clicked`, `newsletter_signup`, `newsletter_confirmed`, `role_viewed`, `application_submitted` without PII | ✅ Pass |

**Post-design re-check**: Pass.

## Project Structure

### Documentation (this feature)

```text
specs/007-blog-content-hub/
├── plan.md  research.md  data-model.md  quickstart.md
└── contracts/content-hub.openapi.yaml
```

### Source Code

```text
api/app/
├── models/{post,tag,industry_page,subscriber,job}.py
├── services/post_service.py          # publish rules, reading time, related ranking, slug history, tag normalisation
├── services/industry_page_service.py # case-study selection (by industry or hand-picked)
├── services/newsletter_service.py    # double opt-in, tokens, purge, per-address email cap
├── services/careers_service.py       # role open/closed logic, PDF check, private upload, signed URLs
├── routers/admin_{posts,industry_pages,roles,applications,subscribers}.py
├── routers/public_{posts,industry_pages,roles}.py
├── routers/newsletter.py             # POST /subscribers, POST /subscribers/confirm, POST /subscribers/unsubscribe
├── routers/applications.py           # POST /api/v1/roles/{slug}/applications (JSON with cv_upload_id; CV uploaded via D6)
└── jobs/{purge_unconfirmed_subscribers,close_expired_roles}.py

web/
├── app/(site)/blog/{page,[slug]/page,category/[slug]/page,tag/[slug]/page}.tsx   # existing prototypes wired to API
├── app/(site)/blog/[slug]/opengraph-image.tsx
├── app/(site)/industries/[slug]/page.tsx     # existing prototype wired to API
├── app/(site)/faq/page.tsx                   # existing prototype wired to /public/faqs
├── app/(site)/careers/{page,[slug]/page}.tsx # existing prototypes + ApplicationForm
├── app/(site)/newsletter/{confirm,unsubscribe}/page.tsx
├── components/blog/{PostBody,TableOfContents,RelatedPosts,PostCta}.tsx
├── components/NewsletterSignup.tsx           # existing, wired
├── components/theme/{ThemeProvider,ThemeSwitch}.tsx
├── app/globals.css                           # light/dark tokens (CSS variables)
├── app/admin/content/{posts,industry-pages,roles}/...  app/admin/{applications,subscribers}/page.tsx
└── app/sitemap.ts                            # + posts, categories, tags (≥ 2 posts), industry pages, open roles
```

**Structure Decision**: This extends `web/` + `api/`. The existing prototype routes and components are kept and wired to the API; their mock data modules (`lib/data/*`, `lib/content/*`) are removed as each part is wired.

## Complexity Tracking

No violations.
