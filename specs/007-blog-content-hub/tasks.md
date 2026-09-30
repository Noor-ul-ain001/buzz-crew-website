---
description: "Task list for 007 Blog, Industry Pages, Newsletter, FAQ, Careers and Theme"
---

# Tasks: Blog, Industry Pages, Newsletter, FAQ, Careers and Theme

**Input**: `specs/007-blog-content-hub/` (plan, spec, research, data-model, contracts/content-hub.openapi.yaml, quickstart), plus `specs/DEPLOYMENT.md`

**Prerequisites**:
- 001: forms, Turnstile, limits, email.
- 003: roles.
- 004: publishing factory, media, uploads.
- 005: Markdown renderer, `CaseStudyCard`.
- 006: `faqs` table.

**Tests**: Included.

**Deployment notes**:
- CVs upload directly to Cloudinary as `authenticated` raw files, then go through `/uploads/finalize` with `usage=cv` (DEPLOYMENT D6); the application JSON carries `cv_upload_id`.
- The subscriber purge and closing expired roles run in the daily cron (D5).

---

## Phase 1: Setup

- [ ] T001 Create branch `007-blog-content-hub`; add `pypdf` to `api/pyproject.toml`; add `@axe-core/playwright` to `web/package.json` dev deps (next-themes, react-markdown, remark-gfm, rehype-slug and github-slugger are already installed)
- [ ] T002 [P] Add `uv run python -m app.cli seed-content-hub` in `api/app/cli.py`: 15 posts across the categories (1 draft), tags (including one used by a single post), 3 industry pages, 10 FAQs (1 draft), 2 roles (1 open, 1 closed). Add the fixtures `api/tests/fixtures/cv_ok.pdf`, `cv_fake.pdf` (a renamed .docx) and `cv_big.pdf` (6 MB).

---

## Phase 2: Foundational

- [ ] T003 Create `web/content/blog-categories.ts`: the `post_category` enum values `social_media`, `seo`, `web_software`, `ui_ux_design`, `meta_ads` and `agency_news`, each with a display name, a URL slug matching the service slugs (plus `agency-news`) and a description. Remove `BLOG_CATEGORIES` from `web/lib/content/types.ts`.
- [ ] T004 Extend the 005 Markdown renderer into `web/components/content/RichMarkdown.tsx`:
  - allowlist adds h2–h4, img (alt required), figure/figcaption through `![alt](url "caption")`, and code;
  - a line holding only a YouTube, Vimeo or Instagram URL renders 005's `ReelPlayer`;
  - `rehype-slug` heading ids;
  - `skipHtml`.

---

## Phase 3: User Story 1 – Read and browse the blog (P1) 🎯 MVP

**Goal**: Blog list, post, category and tag pages with SEO.

**Independent Test**: A post shows its author, date, reading time, category and tags, with a table of contents on long posts. Category and tag pages list only matching published posts. Tag pages with fewer than 2 posts are `noindex`. The BlogPosting JSON-LD is valid.

- [ ] T005 [P] [US1] Tests in `api/tests/test_posts_public.py`: newest first, 12 per page, with `page_count`; category and tag filters; drafts and deleted posts excluded everywhere; a historical slug returns `{redirect_to}`; `GET /public/tags` counts only published posts; response shapes match `PostCard` and `PostDetail` in the contract
- [ ] T006 [US1] Create the models in `api/app/models/post.py` per data-model.md, with an Alembic migration:
  - **`posts`** (+ PublishableMixin): `slug` varchar(100) unique; `title` varchar(120); `excerpt` varchar(200); `body_md` text; `cover_id`; `category` enum `post_category`; `author_id` FK → team_members; `reading_minutes` smallint; `word_count` int; `seo_title` varchar(60) nullable; `seo_description` varchar(160) nullable; `content_updated_at` nullable.
  - **`tags`**: `name` varchar(40); `slug` varchar(50) unique.
  - **`post_tags`**: PK (`post_id`, `tag_id`), "at most 8 per post".
  - **`post_slug_history`**.
- [ ] T007 [US1] Implement `api/app/routers/public_posts.py`: `GET /api/v1/public/posts`, `GET /api/v1/public/posts/{slug}` (embeds the author's name, role and photo, plus `is_published`) and `GET /api/v1/public/tags`
- [ ] T008 [US1] Wire `web/app/(site)/blog/page.tsx`, `blog/[slug]/page.tsx`, `blog/category/[slug]/page.tsx` and `blog/tag/[slug]/page.tsx` (existing prototypes) to the API:
  - fetch with tags `posts` and `post:{slug}`;
  - numbered pages via `?page=`, where each page's canonical is itself and page 1 has no parameter;
  - unknown or empty pages call `notFound()`;
  - `generateMetadata` and share image (`web/app/(site)/blog/[slug]/opengraph-image.tsx`);
  - BlogPosting JSON-LD (headline, author, datePublished, dateModified, image, publisher) and BreadcrumbList;
  - `permanentRedirect` on `redirect_to`;
  - "last updated" shown when `content_updated_at` is set;
  - tag pages with fewer than 2 posts get `robots: noindex, follow`.
- [ ] T009 [P] [US1] Create `web/components/blog/TableOfContents.tsx` (shown when there are 4 or more h2/h3 headings; ids via github-slugger) with a Vitest test in `web/components/blog/TableOfContents.test.tsx`
- [ ] T010 [US1] Remove the mock blog data (`web/lib/data/blog.ts`, `web/lib/data/mock-posts.ts`) once all routes use the API

---

## Phase 4: User Story 2 – Write and publish posts (P1)

**Goal**: The admin editor with preview, SEO fields, tags and publish rules.

**Independent Test**: A draft is not public. Preview works when signed in. Publishing a 200-word post is refused with "Body must be at least 300 words". A valid publish appears within 5 minutes everywhere. A changed slug redirects with 308.

- [ ] T011 [P] [US2] Tests in `api/tests/test_posts_admin.py`:
  - publish requires a title, a body of at least 300 words, an excerpt, a cover with alternative text, a category, an author, and alternative text on every body image;
  - `reading_minutes = ceil(words/200)`, at least 1;
  - `published_at` is set on the first publish only;
  - a published edit to the body or title sets `content_updated_at`;
  - tag normalisation (`Karachi` = `karachi` = ` karachi `), with at most 8 tags;
  - a slug change writes history;
  - revalidation tags `posts`, `post:{slug}` and `tags` are sent (mocked).
- [ ] T012 [US2] Implement `api/app/services/post_service.py` (the rules, reading time and word count on save, tag upsert and normalisation, slug history, `after_commit` tags) and the admin routes through the 004 factory, plus `GET /api/v1/admin/tags?q=` for autocomplete
- [ ] T013 [US2] Wire `web/app/admin/content/posts/page.tsx`, `new/page.tsx` and `[id]/page.tsx` (existing prototypes):
  - a Markdown editor with live `RichMarkdown` preview;
  - excerpt, SEO title and description counters (60/160) and a search-result preview (defaults to the title and excerpt);
  - category select, author select (published team members), and tag autocomplete (at most 8);
  - cover through the 004 ImageField;
  - publish errors shown next to their fields.
- [ ] T014 [US2] Create `web/app/admin/content/posts/[id]/preview/page.tsx` (signed-in only, preview banner, noindex, no-store; broken internal links highlighted)

---

## Phase 5: User Story 3 – Related posts and a next step (P2)

**Goal**: 3 related posts, a service CTA and a newsletter signup at the end of each post.

**Independent Test**: An SEO post shows 3 related published posts and a CTA opening the inquiry form with SEO pre-selected, plus the newsletter signup.

- [ ] T015 [P] [US3] Test in `api/tests/test_posts_related.py`: ranking of 2 points per shared tag plus 1 for the same category, then newest first; excludes the current post and drafts; limit 3
- [ ] T016 [US3] Add `related` to the post detail response in `api/app/services/post_service.py`, and create `web/components/blog/RelatedPosts.tsx` and `web/components/blog/PostCta.tsx` (category → service → `openInquiry({services})` plus the 006 booking anchor link; `agency_news` shows a generic CTA)

---

## Phase 6: User Story 4 – Industry pages (P2)

**Goal**: Editor-managed industry and city landing pages with services, case studies and FAQs.

**Independent Test**: `/industries/restaurant-marketing-karachi` shows services, Food & Beverages case studies, industry FAQs and a CTA; unpublishing it gives a 404 and removes it from the sitemap.

- [ ] T017 [P] [US4] Tests in `api/tests/test_industry_pages.py`: required fields; hand-picked case studies (at most 6, in order) override the automatic selection; automatic selection merges `case_study_industries` in editor order up to 6; draft and unpublished case studies are excluded; drafts return 404
- [ ] T018 [US4] Create the models in `api/app/models/industry_page.py` (+ mixin), with an Alembic migration, and register them through the factory (tag `industry-pages`):
  - **`industry_pages`**: `slug` varchar(100) unique; `industry_name` varchar(60); `city` varchar(60); `country`; `headline` varchar(120); `intro_md`; `challenges_md`; `services` "≥ 1"; `case_study_industries`; `share_image_id` nullable; `seo_title` varchar(60); `seo_description` varchar(160).
  - **`industry_page_case_studies`**: (`industry_page_id`, `case_study_id`, `sort_order`), "at most 6".
- [ ] T019 [US4] Implement `api/app/services/industry_page_service.py` and `GET /api/v1/public/industry-pages/{slug}` in `api/app/routers/public_industry_pages.py`
- [ ] T020 [US4] Wire `web/app/(site)/industries/[slug]/page.tsx` (existing) to the API: services linking to `/services/{slug}`; `CaseStudyCard`s linking to `/work/{slug}` (this closes the 005 T037 TODO) with a book-a-call block when empty; FAQs from `/public/faqs?industry={slug}`; WebPage, Service and BreadcrumbList JSON-LD (not Article, per the spec assumption). Remove `web/lib/data/industries.ts`.
- [ ] T021 [US4] Create the admin screens `web/app/admin/content/industry-pages/{page,new/page,[id]/page}.tsx` (case-study picker with up to 6, drag to order)

---

## Phase 7: User Story 5 – Newsletter with double opt-in (P2)

**Goal**: Subscribe, confirm, and unsubscribe at any time, without revealing who is subscribed.

**Independent Test**: A new email becomes `pending`; the link confirms it; a second click shows the same thanks; a confirmed email gets the identical message with no email sent; unsubscribing takes effect immediately; pending sign-ups older than 30 days are purged.

- [ ] T022 [P] [US5] Tests in `api/tests/test_newsletter.py`:
  - every state returns the same 202 message ("Check your inbox to confirm your subscription");
  - new → `pending` plus an email; pending → re-send (at most 3 emails per address per 24 h); confirmed → no email; unsubscribed → pending plus an email;
  - confirm is idempotent; a link older than 7 days returns 410; unsubscribe is idempotent;
  - the one-click POST (RFC 8058) works;
  - the purge deletes pending rows older than 30 days;
  - Turnstile failure returns 400; the per-IP limit returns 429.
- [ ] T023 [US5] Create the `subscribers` table in `api/app/models/subscriber.py`: `email` unique lower; `status` enum (`pending`,`confirmed`,`unsubscribed`); `confirm_token_hash` char(64) nullable; `confirm_token_expires_at` "+7 days"; `unsubscribe_token_hash` char(64); `source_page` varchar(200); `signed_up_at`, `confirmed_at`, `unsubscribed_at`. Add `newsletter_confirmation` to `email_kind`, and an Alembic migration.
- [ ] T024 [US5] Implement `api/app/services/newsletter_service.py` and `api/app/routers/newsletter.py`: `POST /api/v1/subscribers`, `/subscribers/confirm`, `/subscribers/unsubscribe`; the email template `api/app/templates/email/newsletter_confirmation.{html,txt}` with `List-Unsubscribe` and `List-Unsubscribe-Post` headers; sent inline (D4)
- [ ] T025 [US5] Wire `web/components/NewsletterSignup.tsx` (existing) with Turnstile, a privacy link and "what you'll receive" text, placed in the footer, on the blog home and at the end of each post; create `web/app/(site)/newsletter/confirm/page.tsx` and `unsubscribe/page.tsx` (these POST automatically on load with a button fallback, and show the re-subscribe option)
- [ ] T026 [US5] Implement `purge_unconfirmed_subscribers()` in `api/app/jobs/content_hub_jobs.py` (called by the daily cron, D5) and the admin-only `GET /api/v1/admin/subscribers`, wiring `web/app/admin/subscribers/page.tsx` (admin only, per 003)

---

## Phase 8: User Story 6 – Careers and applications (P2)

**Goal**: List open roles and apply with a PDF CV; applications are admin-only.

**Independent Test**: Only the open role is listed and in the sitemap; the closed role's page says it is no longer open (noindex). A fake or oversized CV is rejected with the messages. A valid application stores the CV privately; an editor gets 403; the signed URL expires after 60 s.

- [ ] T027 [P] [US6] Tests in `api/tests/test_careers.py`:
  - `finalize` with `usage=cv` on `cv_fake.pdf` returns 415 "Your CV needs to be a PDF. Save or export it as PDF and try again." and deletes the temporary file; `cv_big.pdf` returns 413 "Your CV is larger than 5 MB. Please upload a smaller PDF.";
  - `cv_ok.pdf` succeeds;
  - an application with the same email for the same role returns 409 `already_applied`; a closed or expired role returns 409 `role_closed`;
  - an editor gets 403 on the admin applications and CV endpoints; the CV signed URL has a 60 s expiry;
  - the confirmation email goes to the applicant; the admin notification has no attachment.
- [ ] T028 [US6] Create the models in `api/app/models/job.py`, with an Alembic migration:
  - **`job_roles`** (+ mixin, `status` extended with `closed`): `slug` varchar(100) unique; `title` varchar(100); `employment_type` enum (`full_time`,`part_time`,`internship`); `work_arrangement` enum (`onsite_karachi`,`hybrid`,`remote`); `description_md`, `responsibilities_md`, `requirements_md`, `offer_md`; `closing_date` date nullable.
  - **`job_applications`**: `name` varchar(100); `email` varchar(254), unique with `role_id` (lower); `phone` varchar(20); `cv_provider_id` varchar(255); `cv_size_bytes` "≤ 5 MB"; `cover_note` varchar(1500) nullable; `portfolio_url` varchar(300) nullable; `status` enum (`new`,`reviewed`,`shortlisted`,`rejected`); `created_at`.
- [ ] T029 [US6] Extend `api/app/services/media_service.py` for `usage=cv`: sign with `resource_type=raw`, `type=authenticated`, `allowed_formats=pdf`; finalise by checking a size of 5 MB or less, the `%PDF-` header and that `pypdf.PdfReader` opens the file, then move it to `{folder}/cvs/`. Signature requests for CVs require Turnstile and the per-visitor limit.
- [ ] T030 [US6] Implement `api/app/services/careers_service.py` (open means `status=published AND (closing_date IS NULL OR closing_date >= today in Asia/Karachi)`; applications; signed download URLs valid for 60 s) and the routes: `GET /api/v1/public/roles`, `GET /api/v1/public/roles/{slug}` (`is_open:false` for closed or expired), `POST /api/v1/roles/{slug}/applications` (JSON with `cv_upload_id`), and the admin-only `GET /api/v1/admin/applications` and `GET /admin/applications/{id}/cv`; emails `api/app/templates/email/application_{confirmation,admin_notification}.{html,txt}`
- [ ] T031 [US6] Wire `web/app/(site)/careers/page.tsx` and `careers/[slug]/page.tsx` (existing) and `web/components/careers/ApplicationForm.tsx` (existing validation kept): a direct Cloudinary upload through the D6 flow with progress; JobPosting JSON-LD for open roles only; a noindex "no longer open" page for closed roles; an empty state inviting job seekers to join the newsletter
- [ ] T032 [US6] Create the admin screens `web/app/admin/content/roles/*` (with a Close action) and wire `web/app/admin/applications/page.tsx` (admin only; downloads through the signed URL); implement `close_expired_roles()` in `api/app/jobs/content_hub_jobs.py` for the daily cron

---

## Phase 9: User Story 7 – FAQ page (P3)

**Goal**: The public `/faq` page over the 006 FAQ table.

**Independent Test**: Published FAQs are grouped by topic; the draft is absent; Enter or Space toggles items; the FAQPage JSON-LD matches the visible items.

- [ ] T033 [US7] Wire `web/app/(site)/faq/page.tsx` (existing) to `GET /api/v1/public/faqs` (tag `faqs`): topics in a fixed order (`working_with_us`, `pricing_approach`, `timelines`, `process`, `services`); `<details>`/`<summary>` items; one FAQPage JSON-LD built from the rendered items; remove `web/lib/data/mock-faqs.ts`
- [ ] T034 [P] [US7] Playwright test in `web/e2e/faq.spec.ts`: keyboard toggle; the draft FAQ is absent; the JSON-LD question count equals the visible count

---

## Phase 10: User Story 8 – Light and dark themes (P3)

**Goal**: Follow the device setting, a manual switch, and AA contrast in both themes.

**Independent Test**: With the device set to dark, the site loads dark with no flash; choosing Light persists across visits; axe `color-contrast` reports 0 violations in both themes on key pages, including the admin area.

- [ ] T035 [US8] Define the light and dark colour tokens as CSS variables for `:root` and `.dark` in `web/app/globals.css`, mapped through Tailwind v4 `@theme`; check each text and background pair (≥ 4.5:1, or ≥ 3:1 for large text, UI and focus indicators) and adjust the brand tokens where needed
- [ ] T036 [US8] Create `web/components/theme/ThemeProvider.tsx` (next-themes `attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange`) in `web/app/layout.tsx`, and `web/components/theme/ThemeSwitch.tsx` (a labelled radio group: Light, Dark, System) in the header and mobile menu, and in the admin layout
- [ ] T037 [P] [US8] Playwright test in `web/e2e/a11y-themes.spec.ts` using `@axe-core/playwright` (`color-contrast`) on `/`, a blog post, `/services/seo`, `/contact` and `/admin/leads` (signed in as admin) in both themes, plus a check that there is no flash (the `html` class is present before hydration)

---

## Phase 11: Polish

- [ ] T038 [P] Extend `web/app/sitemap.ts`: posts (`updated_at`), category pages, tags with 2 or more posts, published industry pages and open roles; exclude drafts, closed roles and tags with fewer than 2 posts
- [ ] T039 [P] Track `post_viewed`, `blog_filter_used`, `post_cta_clicked`, `newsletter_signup`, `newsletter_confirmed`, `role_viewed` and `application_submitted` in `web/lib/analytics.ts` (no PII)
- [ ] T040 [P] Add `APPLICATION_RETENTION_DAYS` (unset by default, meaning no automatic deletion; pending the retention decision in feature 002) to `api/app/core/config.py`, and an admin delete action that removes the CV file too
- [ ] T041 Run Lighthouse on a blog post and an industry page (SEO and Accessibility ≥ 90), and quickstart scenarios 1–19 on the Vercel Hobby preview

## Dependencies

- **Order**: Setup → Foundational → US1 → US2 → US3.
- **Independent after Foundational**: US4, US5, US6, US7 and US8 each depend only on Foundational plus their prerequisite features. US5 is needed by US3's signup placement (a stub signup can be placed first).
- **Build in**: 1 → 2 → 3, then 5 → 6 → 4 → 7 → 8, or in parallel by separate people.

## Parallel examples

- US4, US6 and US8 can proceed in parallel.
- All `[P]` tests within each phase.

## Implementation strategy

**MVP**: US1 + US2 (publishing the blog). Then US5 (newsletter), US6 (careers), US4 (industry pages), US3, US7 and US8.
