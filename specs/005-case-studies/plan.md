# Implementation Plan: Case Studies

**Branch**: `005-case-studies` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-case-studies/spec.md`

## Summary

Case studies reuse feature 004's `PublishableMixin`, media pipeline, publish-rule service, activity log and revalidation webhook.

**Backend**:
- **Tables**: `case_studies` for the story fields, with the challenge, strategy and execution stored as restricted Markdown. `case_study_results` holds 1–6 metrics with a headline flag, and publishing requires at least one. `case_study_media` holds up to 20 images and 5 video reels in order. `case_study_slug_history` holds old addresses, so they redirect permanently.
- **Public endpoints**: list with a single industry and/or service filter, facet counts and page-based "load more"; get by slug, including a redirect hint and related case studies.
- **Admin**: CRUD under the 004 router pattern.

**Web**:
- **`/work`**: server-rendered, with filters held in URL search params (shareable, back and forward work) and a canonical address of the unfiltered `/work`.
- **`/work/[slug]`**: statically generated with tag-based revalidation. It uses `generateMetadata`, CreativeWork and Breadcrumb JSON-LD, and a per-slug Open Graph image.
- **Page features**: an accessible before/after slider (a native range input overlaid on the images), link-based video reels that load only when played, a share control, and a "Start a similar project" call to action that opens the 001 inquiry modal with the case study's services pre-selected.
- **Preview**: drafts are previewed inside the authenticated admin area (feature 003) using the same page component, so no public preview URL exists.

## Technical Context

**Language/Version**: TypeScript 5 strict / Next.js 16.3; Python 3.12+

**Primary Dependencies**:
- **web**: `react-markdown` + `remark-gfm` (already installed) with an element allowlist, `next/og` for share images, `next/image` with the Cloudinary loader from 004
- **api**: SQLModel and the 004 publishing and media services; `python-slugify`

**Storage**: Neon Postgres (4 new tables); Cloudinary (images, from 004)

**Testing**: pytest covers:
- the publish rules: no metric, a reel without a description, missing alternative text;
- filters, facets and pagination;
- slug uniqueness and slug-history redirect;
- draft invisibility on every public endpoint, and related-case-study ranking.

Vitest covers slider keyboard, pointer and ARIA behaviour, and filter URL serialisation. Playwright covers: filter by industry, share the URL, open a case study, drag the slider, and start an inquiry with services pre-selected.

**Target Platform**: Vercel Hobby (free) for both the `web` and `api` projects (practice project) — see [DEPLOYMENT.md](../DEPLOYMENT.md) and [COSTS.md](../COSTS.md)

**Project Type**: Web application (`web/` + `api/`)

**Performance Goals**:
- Case study pages meet Core Web Vitals (LCP ≤ 2.5 s mobile), because the cover image is the LCP element with priority loading and no third-party video loads on page load.
- The list filter response p95 < 150 ms.

**Constraints**:
- 1–6 metrics, up to 3 headline.
- Up to 20 images and 5 reels.
- Reel hosts: YouTube, Vimeo or Instagram.
- The slider works with mouse, touch and keyboard, and doesn't block vertical scrolling.
- Drafts must never appear anywhere public.

**Scale/Scope**: Tens of case studies; 2 public routes; 1 admin editor.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-driven | No open markers. Depends on 001, 003 and 004 (planned). Feature 002 (SEO standards) is not planned yet; this plan applies the constitution's SEO rules directly. | ✅ Pass |
| II. SEO & performance | SSG/ISR pages, unique metadata, canonical URLs, CreativeWork JSON-LD, sitemap entries, readable `/work/{slug}` addresses | ✅ Pass |
| III. Contract-first | [contracts/case-studies.openapi.yaml](./contracts/case-studies.openapi.yaml) | ✅ Pass |
| IV. Test-first | Publish-rule, visibility and filter tests first | ✅ Pass |
| V. Security & privacy | Admin writes need admin or editor; Markdown rendered with an allowlist and no raw HTML; preview only inside the admin area | ✅ Pass |
| VI. Type safety | Generated types; Zod for filter search params | ✅ Pass |
| VII. Accessible | Native range input slider, announced filter result counts, keyboard-operable reels and share control, reduced-motion respected | ✅ Pass |
| VIII. Simplicity | No draft-mode or preview-token system (admin-area preview instead); no search engine (SQL filters) | ✅ Pass |
| IX. AI | N/A | N/A |
| X. Observability | Events `case_study_viewed`, `work_filter_used`, `similar_project_clicked` without PII | ✅ Pass |

**Post-design re-check**: Pass.

## Project Structure

### Documentation (this feature)

```text
specs/005-case-studies/
├── plan.md  research.md  data-model.md  quickstart.md
└── contracts/case-studies.openapi.yaml
```

### Source Code

```text
api/app/
├── models/case_study.py            # CaseStudy, CaseStudyResult, CaseStudyMedia, CaseStudySlugHistory, schemas
├── services/case_study_service.py  # publish rules (extends publishing.can_publish), related ranking, facets, slug history
├── routers/admin_case_studies.py   # CRUD, publish/unpublish, reorder (004 router factory)
└── routers/public_case_studies.py  # GET list (filters, facets, page), GET by slug (+redirect_to, +related)
api/tests/test_case_study_publish.py  test_case_study_filters.py  test_case_study_slugs.py  test_case_study_visibility.py

web/
├── app/(site)/work/page.tsx                    # list + filters (searchParams) + canonical /work
├── app/(site)/work/[slug]/page.tsx             # generateStaticParams, generateMetadata, JSON-LD, notFound/permanentRedirect
├── app/(site)/work/[slug]/opengraph-image.tsx  # next/og share image from cover + title
├── components/work/{CaseStudyCard,WorkFilters,ResultStats,BeforeAfterSlider,ReelPlayer,ShareButtons,SimilarProjectCta}.tsx
├── app/admin/content/case-studies/{page,new/page,[id]/page,[id]/preview/page}.tsx
├── lib/content/case-studies.ts                 # fetchers with tags ["case-studies", "case-study:{slug}"]
└── app/sitemap.ts                              # + published case studies
```

**Structure Decision**: This extends `web/` + `api/`, reusing the 004 modules. `ShareButtons` already exists for the blog prototype and is generalised.

## Complexity Tracking

No violations.
