---
description: "Task list for 005 Case Studies"
---

# Tasks: Case Studies

**Input**: `specs/005-case-studies/` (plan, spec, research, data-model, contracts/case-studies.openapi.yaml, quickstart), plus `specs/DEPLOYMENT.md`

**Prerequisites**: 001 (inquiry modal `openInquiry({services})`), 003 (roles) and 004 (PublishableMixin, publishing service, media finalise flow, revalidation, router factory) are complete.

**Tests**: Included (constitution Principle IV).

---

## Phase 1: Setup

- [ ] T001 Create branch `005-case-studies`; add `python-slugify` to `api/pyproject.toml`

---

## Phase 2: Foundational (blocking)

- [ ] T002 Create the models in `api/app/models/case_study.py` per data-model.md, with an Alembic migration:
  - **Enum** `case_study_industry` (`food_beverages`,`farmhouses`,`healthcare_dental`,`education`,`ecommerce`,`other`).
  - **`case_studies`** (+ PublishableMixin):
    - `slug` varchar(80) unique "lowercase hyphenated"; `client_name` varchar(100); `title` varchar(120); `summary` varchar(200);
    - `industry`; `country` `lead_country`; `services` `lead_service[]` "≥ 1";
    - `challenge_md`, `strategy_md`, `execution_md` text "≤ 10,000 each"; `project_period` varchar(40) nullable;
    - `cover_id` FK → media; `before_image_id` and `after_image_id` nullable "both or neither"; `before_label` and `after_label` varchar(30) default "Before"/"After";
    - `testimonial_id` FK nullable; `seo_title` varchar(60) nullable; `seo_description` varchar(160) nullable.
    - Indexes: unique `slug`, (`status`,`deleted_at`,`sort_order`), GIN on `services`, `industry`.
  - **`case_study_results`**: `value` varchar(30); `label` varchar(80); `period` varchar(40); `starting_value` varchar(30) nullable; `is_headline` bool "at most 3"; `sort_order`.
  - **`case_study_media`**: `kind` enum (`image`,`reel`) "images ≤ 20, reels ≤ 5"; `media_id`; `video_url` varchar(300) "required when reel"; `description` varchar(200) "required to publish when reel"; `sort_order`.
  - **`case_study_slug_history`**: `old_slug` PK; `case_study_id`; `created_at`.
- [ ] T003 Implement `api/app/services/case_study_service.py`:
  - `can_publish` extends `publishing.can_publish`: every FR-001 field is present; 1–6 results, with error text exactly "Add at least one result before publishing"; at most 3 headline results (if none is flagged, the first is treated as headline); alternative text on the cover, gallery and before/after images; each reel has a description and preview image; the slug is unique.
  - `suggest_slug(client_name, title)` (slugify, ≤ 80 characters).
  - Changing a published slug writes `case_study_slug_history`.
  - Registers the `after_commit` revalidation tags `case-studies` and `case-study:{slug}`.
- [ ] T004 Implement the admin routes through the 004 factory in `api/app/routers/admin_case_studies.py` (CRUD, publish, unpublish, order, nested results and media arrays in the payload); a duplicate slug returns 409 `slug_taken`
- [ ] T005 [P] Tests in `api/tests/test_case_study_publish.py`: no results → exact message; 7 results refused; 4 headline results refused; a reel without a description refused; before without after refused; missing alternative text refused; duplicate slug 409
- [ ] T006 [P] Add `uv run python -m app.cli seed-case-studies` in `api/app/cli.py`: 6 published case studies across 3 industries plus 1 draft, with results and media (placeholder images uploaded through the media service)

**Checkpoint**: Case studies can be created and published through the API.

---

## Phase 3: User Story 1 – Read a case study that proves results (P1) 🎯 MVP

**Goal**: The `/work/[slug]` page with a results-first layout, SEO and a share image.

**Independent Test**: On a phone, the client, industry, country, services and headline metrics are on the first screen; sections follow in order; no third-party video requests happen before Play; the JSON-LD is valid.

- [ ] T007 [P] [US1] Tests in `api/tests/test_case_study_visibility.py`: `GET /public/case-studies/{slug}` returns 404 for a draft, a deleted item and an unknown slug (indistinguishable); the response matches `CaseStudyDetail` in the contract; a testimonial is included only if it is published
- [ ] T008 [US1] Implement `api/app/routers/public_case_studies.py` `GET /api/v1/public/case-studies/{slug}` and `GET /api/v1/public/case-studies/slugs`
- [ ] T009 [US1] Create `web/lib/content/case-studies.ts` fetchers with tags `["case-studies", "case-study:{slug}"]` and `revalidate: 300`
- [ ] T010 [US1] Create `web/app/(site)/work/[slug]/page.tsx`:
  - `generateStaticParams` from the slugs endpoint, with `dynamicParams = true`;
  - `generateMetadata` (seo_title or title, seo_description or summary, canonical `/work/{slug}`);
  - `notFound()` on 404;
  - CreativeWork and BreadcrumbList JSON-LD;
  - layout: hero (client, industry, country, services, headline metrics), then challenge, strategy, execution, all results, media, testimonial.
- [ ] T011 [P] [US1] Create `web/components/work/MarkdownSection.tsx`: `react-markdown` + `remark-gfm` with `skipHtml` and `allowedElements` = p, h2, h3, ul, ol, li, strong, em, a, blockquote; external links get `rel="noopener noreferrer" target="_blank"`
- [ ] T012 [P] [US1] Create `web/components/work/ResultStats.tsx`: value, label, period and optional "from {starting_value}"; wraps cleanly at 360 px
- [ ] T013 [P] [US1] Create `web/components/work/ReelPlayer.tsx`: a preview image and play button; the provider iframe (youtube-nocookie, Vimeo player or Instagram embed) is injected only on click; if the embed errors, the preview stays with "This video is unavailable"; keyboard operable
- [ ] T014 [P] [US1] Create `web/app/(site)/work/[slug]/opengraph-image.tsx` (next/og: cover, title, client, first headline metric, brand colours from `web/lib/site.ts`)

---

## Phase 4: User Story 2 – Start an inquiry from a case study (P1)

**Goal**: A "Start a similar project" CTA opens the inquiry form with the services pre-selected.

**Independent Test**: The CTA opens the modal with the case study's services ticked; the submitted lead has `source_page=/work/{slug}`.

- [ ] T015 [P] [US2] Vitest test in `web/components/work/SimilarProjectCta.test.tsx`: clicking calls `openInquiry({ services })`, and the sticky variant appears after 40% scroll on mobile
- [ ] T016 [US2] Create `web/components/work/SimilarProjectCta.tsx` (end-of-story CTA plus an unobtrusive sticky mobile CTA, with a WhatsApp alternative) and use it in `web/app/(site)/work/[slug]/page.tsx`
- [ ] T017 [US2] Extend `web/components/inquiry/InquiryForm.tsx` to accept initial `services` from `openInquiry` options (the visitor can change them)

---

## Phase 5: User Story 3 – Editors create, preview and publish (P1)

**Goal**: The admin editor with results repeater, media gallery, before/after and testimonial picker, plus a signed-in-only preview.

**Independent Test**: A draft preview works when signed in and redirects to login when signed out; publishing with no results shows the exact message; unpublishing removes the case study everywhere public within one request.

- [ ] T018 [P] [US3] Test in `api/tests/test_case_study_slugs.py`: suggested slug; changing a published slug makes the old slug return `{redirect_to}`; unpublish then triggers revalidation with both tags (mocked)
- [ ] T019 [P] [US3] Playwright test in `web/e2e/case-study-admin.spec.ts`: create a draft, preview with the banner, sign out and have the preview URL redirect, publish with zero results (message shown), add a result and publish (visible at `/work/{slug}`), then unpublish (404)
- [ ] T020 [US3] Create `web/app/admin/content/case-studies/page.tsx` (list using the 004 table components), `new/page.tsx` and `[id]/page.tsx`: field groups; Markdown editor with live preview using `MarkdownSection`; results repeater (1–6, headline toggle limited to 3); media gallery using 004's ImageField plus reel rows (URL, description, preview image); a before/after pair with labels; testimonial select (published and draft testimonials listed, public display filtered); slug field with a suggestion button
- [ ] T021 [US3] Create `web/app/admin/content/case-studies/[id]/preview/page.tsx`: `requireRole("admin","editor")`, fetch the draft from the admin API, render the shared `web/components/work/CaseStudyView.tsx` (extracted from T010) with a "Preview" banner, `robots` noindex, `dynamic = "force-dynamic"`
- [ ] T022 [US3] In `web/app/(site)/work/[slug]/page.tsx`, call `permanentRedirect()` when the API returns `redirect_to`

---

## Phase 6: User Story 4 – Browse and filter (P2)

**Goal**: The `/work` list with industry and service filters, facet counts and load more.

**Independent Test**: Filtering by industry, by service and by both shows only matches with correct counts; an empty combination shows a message with clear filters and an inquiry CTA; there are 12 per page with load more.

- [ ] T023 [P] [US4] Tests in `api/tests/test_case_study_filters.py`: filter by industry, by service and by both (AND); facets count only published items; `page` and `page_size` (3 or 12); drafts are excluded from counts
- [ ] T024 [US4] Implement `GET /api/v1/public/case-studies` (filters, facets, page) in `api/app/routers/public_case_studies.py`
- [ ] T025 [P] [US4] Create `web/lib/content/work-filters.ts`: a Zod schema for `industry`, `service` and `page` search params mapping hyphenated URL values (for example `healthcare-dental`) to enum values, silently dropping unknown values; Vitest test in `web/lib/content/work-filters.test.ts`
- [ ] T026 [US4] Create `web/app/(site)/work/page.tsx`: server-rendered list using `CaseStudyCard`; `WorkFilters` (only options with a count above 0, each showing its count) updating the URL with `router.replace(…, { scroll: false })` inside `useTransition`, so previous results stay visible; the result count announced in a live region; load more fetches the next page (`?page=` stays shareable); an empty state with a clear-filters button and inquiry CTA; canonical `/work`, plus `robots: noindex, follow` when filters are applied
- [ ] T027 [P] [US4] Create `web/components/work/CaseStudyCard.tsx` (cover, client, industry, country, up to 3 headline metrics)

---

## Phase 7: User Story 5 – Share a filtered view or case study (P2)

**Goal**: Shareable addresses and a share control.

**Independent Test**: A copied filtered URL opened in a private window shows the same filters and results; the share control uses the device's share menu on phones and copy link with confirmation elsewhere.

- [ ] T028 [US5] Generalise `web/components/blog/ShareButtons.tsx` into `web/components/ShareButtons.tsx` (`navigator.share` when available, otherwise copy link with a "Link copied" live-region confirmation, plus WhatsApp and LinkedIn links), and use it on the case study page
- [ ] T029 [P] [US5] Playwright test in `web/e2e/case-studies.spec.ts`: apply filters, open the URL in a new context (same results), Back restores the previous filters, and share copies the URL

---

## Phase 8: User Story 6 – Before/after slider (P3)

**Goal**: An accessible comparison slider.

**Independent Test**: Mouse drag, touch drag and keyboard (arrow keys, Page Up/Down, Home/End) move the divider; the screen reader hears the position text; vertical scrolling works on touch.

- [ ] T030 [P] [US6] Vitest test in `web/components/work/BeforeAfterSlider.test.tsx`: starts at 50; arrow keys change it by 1, Page Up/Down by 10, Home/End go to 0/100; `aria-valuetext` "Showing X% before, Y% after"; labels rendered as text
- [ ] T031 [US6] Create `web/components/work/BeforeAfterSlider.tsx`: two `next/image` elements in the same aspect box, the "after" image clipped with `clip-path: inset(0 0 0 X%)`, a native `<input type="range">` overlay with `aria-label="Before and after comparison"`, `touch-action: pan-y`, and no auto-animation

---

## Phase 9: User Story 7 – Related work (P3)

**Goal**: Up to 3 related published case studies.

**Independent Test**: A case study shows up to 3 others (same industry first, then shared services), never itself or drafts; the section is hidden when there are none.

- [ ] T032 [P] [US7] Test in `api/tests/test_case_study_related.py`: ranking of 3 points for the same industry plus 1 per shared service, then `sort_order`; excludes the current item and drafts; returns an empty list when none match
- [ ] T033 [US7] Add `related` to the detail response in `api/app/services/case_study_service.py`, and render it with `CaseStudyCard` in `web/components/work/CaseStudyView.tsx` (hidden when empty)

---

## Phase 10: Polish

- [ ] T034 [P] Add published case studies to `web/app/sitemap.ts`, using the slugs endpoint with `updated_at`
- [ ] T035 [P] Track `case_study_viewed`, `work_filter_used` (the filter name only) and `similar_project_clicked` via `web/lib/analytics.ts` (extend the event union; no PII)
- [ ] T036 [P] Run Lighthouse on a case study with reels (mobile SEO ≥ 90, Accessibility ≥ 90, LCP ≤ 2.5 s) and axe on `/work` and `/work/[slug]`
- [ ] T037 Link the existing industry-page "Related case studies" TODO in `web/app/(site)/industries/[slug]/page.tsx` to `/work/{slug}` once 007 wires industry pages; note the follow-up there
- [ ] T038 Run quickstart scenarios 1–13 on the Vercel Hobby preview

## Dependencies

- **Order**: Setup → Foundational → US1 → US2 and US3 in parallel → US4 → US5 → US6 and US7 in parallel → Polish.
- **US1 without US3**: US1 can be verified with the seed command (T006) before the admin editor (US3) exists.

## Parallel examples

- T011, T012, T013 and T014 in US1.
- US6 and US7 together.

## Implementation strategy

**MVP**: Foundational + US1 + US2 + US3, so real case studies can be published and convert visitors. Then add the list and filters (US4), sharing (US5) and the extras (US6, US7).
