# Research: Case Studies

> **Hosting update (2026-09-28):** the project runs entirely on Vercel Hobby. The decisions in [DEPLOYMENT.md](../DEPLOYMENT.md) take precedence over this file where they conflict. They are D1–D2 (hosting and routing) and D6 (uploads through the 004 finalise flow).

## R1. Rich text storage and rendering

- **Decision**: The challenge, strategy and execution sections are stored as Markdown (maximum 10,000 characters each). The web renders them with `react-markdown` + `remark-gfm`, with `skipHtml` and an `allowedElements` list: p, h2, h3, ul, ol, li, strong, em, a, blockquote. Links get `rel="noopener noreferrer"`, and external links open in a new tab. The admin editor is a Markdown textarea with a toolbar and a live preview that uses the same renderer.
- **Rationale**: This meets FR-004 ("any other markup removed") without storing HTML, and reuses installed dependencies. The blog (007) uses the same approach.
- **Alternatives considered**: A WYSIWYG editor (TipTap) was rejected as a heavy bundle with HTML storage that needs sanitising. Sanitised HTML storage was rejected as a larger attack surface.

## R2. Publish rules

- **Decision**: `case_study_service.can_publish` extends 004's rules with these checks:
  - all FR-001 required fields;
  - at least 1 metric and no more than 6, with at most 3 flagged headline (if none is flagged, the first metric is treated as headline);
  - a cover image with alternative text, and every image and before/after image with alternative text;
  - every reel with a description and a preview image;
  - a unique slug.

  The metric error message is exactly "Add at least one result before publishing".
- **Rationale**: This meets FR-015 and the spec's acceptance criterion.

## R3. Addresses and redirects

- **Decision**: The slug is suggested from `client_name + title` with `python-slugify` (lowercase, hyphenated, at most 80 characters). It can be edited, and uniqueness is enforced (409 `slug_taken`). When a *published* case study's slug changes, the old slug goes into `case_study_slug_history`. `GET /public/case-studies/{slug}` returns `{ redirect_to }` for a historical slug, and the page calls `permanentRedirect()` (308).
- **Rationale**: This meets FR-012 and FR-017. plan.md's "stable once published" was relaxed, because the spec allows changes with redirects.

## R4. Filtering and shareable views

- **Decision**:
  - **URL**: `/work?industry=healthcare-dental&service=seo&page=2`. Search params are parsed with Zod, and unknown values are dropped silently (FR-022).
  - **Rendering**: the page is a dynamic Server Component. Filter changes use `<Link>`/`router.replace` with `scroll: false`, so browser history works and the previous results stay visible during loading (`useTransition`).
  - **API**: returns `items`, `total` and `facets` (counts per industry and service for published items). The UI shows only options with a count above 0.
  - **Load more**: fetches page `n+1` and appends it on the client, while `?page=` keeps it shareable (the server renders pages 1..n when the link is opened directly).
  - **Canonical**: always `/work`. Filtered views also carry `robots: noindex, follow` (FR-023).
- **Rationale**: This meets FR-020–FR-024 and SC-003.
- **Alternatives considered**: Client-only filtering of the full list was rejected because the list isn't shareable server-side and grows over time.

## R5. Before/after slider

- **Decision**: Two stacked `next/image` elements, with the "after" image clipped by `clip-path: inset(0 0 0 X%)`. A visually subtle native `<input type="range">` (0–100, step 1, starting at 50) is overlaid, with `aria-label="Before and after comparison"` and `aria-valuetext="Showing 50% before, 50% after"`. The native input handles arrows, Page Up/Down and Home/End. Pointer dragging goes through the input as well. `touch-action: pan-y` keeps vertical page scrolling. Labels are shown as text. There is no auto-animation, so `prefers-reduced-motion` is respected. If the two images differ in size, they render into the same aspect box (`object-fit: cover`), and the editor preview shows a warning.
- **Rationale**: This meets FR-013 and SC-006 with native accessibility and no library.
- **Alternatives considered**: `react-compare-slider` was rejected as an extra dependency with a custom ARIA implementation.

## R6. Video reels

- **Decision**: Reels are stored as URLs on the YouTube, Vimeo or Instagram hosts, with an uploaded preview image (004 media) and a description. The page shows the preview and a play button. The provider's embed iframe (`youtube-nocookie.com`, the Vimeo player, or the Instagram embed) is injected only on click. If the embed fails to load, the preview remains with the message "This video is unavailable".
- **Rationale**: This meets FR-005, the performance constraint and the unavailable-reel edge case, with no third-party requests before consent to play.

## R7. Related case studies

- **Decision**: SQL ranking over published items excluding the current one: 3 points for the same industry, plus 1 point per shared service. The result is ordered by score, then by `sort_order`, with a limit of 3. It is returned in the detail response.
- **Rationale**: This meets FR-025 deterministically and cheaply.

## R8. Draft preview

- **Decision**: `/admin/content/case-studies/[id]/preview` (behind feature 003's session and role check) fetches the draft through the admin API and renders the shared `<CaseStudyView>` component with a "Preview" banner. The page is `noindex` and `Cache-Control: no-store`.
- **Rationale**: This meets FR-016 ("only to signed-in team members"). It is simpler than Next.js Draft Mode plus preview tokens (plan.md), and nothing public ever serves draft data.

## R9. Revalidation tags and visibility

- **Decision**: Tags are `case-studies` (list, facets, sitemap, service and industry pages later) and `case-study:{slug}` (detail). Publish, unpublish, edit, reorder and delete send both tags through the 004 webhook, with `{ expire: 0 }`. Unpublished slugs return 404 from the API, and the page calls `notFound()`. `generateStaticParams` returns only published slugs, with `dynamicParams = true` so new ones render on demand.
- **Rationale**: This meets FR-014 (5-minute updates) and FR-019 (not reachable or listed anywhere public).

## R10. Starting an inquiry from a case study

- **Decision**: `SimilarProjectCta` calls the 001 `openInquiry({ services })` context function. The form pre-selects those services, and `source_page` is `/work/{slug}` (already captured by 001). A sticky, unobtrusive CTA appears after 40% scroll on mobile.
- **Rationale**: This meets FR-010 without changing 001's API: the case study is identified by `source_page`.

## R11. Share images and structured data

- **Decision**: `opengraph-image.tsx` per slug renders the cover image with the title, client and the first headline metric, using `next/og` and brand fonts. JSON-LD is `CreativeWork` (name, about, creator = Organization, image, datePublished, dateModified) plus `BreadcrumbList`.
- **Rationale**: This meets FR-008.
