# Research: Blog, Industry Pages, Newsletter, FAQ, Careers and Theme

> **Hosting update (2026-09-28):** the project runs entirely on Vercel Hobby. The decisions in [DEPLOYMENT.md](../DEPLOYMENT.md) take precedence over this file where they conflict. They are D6 (CVs are uploaded directly to Cloudinary as authenticated raw files, then verified by `finalize`; the application sends `cv_upload_id` instead of a multipart file; replaces part of R8), D3 (limits) and D5 (the subscriber purge and closing expired roles run in the daily cron).

## R1. Post body format and table of contents

- **Decision**: Posts are Markdown, with the same allowlist renderer as feature 005 extended with: h2–h4, img (with required alt), figure/figcaption through a custom `![alt](url "caption")` handler, code, and a video-link directive. The directive is a line containing only a YouTube, Vimeo or Instagram URL, rendered with 005's click-to-load player. `rehype-slug` + `github-slugger` generate heading ids. A table of contents is rendered when there are 4 or more h2/h3 headings. Reading time is `ceil(words / 200)`, at least 1, computed on the API at save.
- **Rationale**: This meets FR-002 and FR-008 and reuses installed libraries and 005's renderer.
- **Alternatives considered**: MDX in the database was rejected because it executes code and is unsafe for CMS content.

## R2. Categories and tags

- **Decision**: `post_category` is an enum: `social_media`, `seo`, `web_software`, `ui_ux_design`, `meta_ads`, `agency_news`. Display names and descriptions live in `web/content/blog-categories.ts`, and category slugs match the service slugs. Tags live in a `tags` table (`name`, `slug` unique), normalised with `slugify(trim(collapse_spaces(name)))`. The admin tag field autocompletes from `GET /admin/tags?q=`.
- **Rationale**: This meets FR-003 and FR-012. It replaces the prototype's four categories, as the spec assumption requires.

## R3. Authors

- **Decision**: `posts.author_id` → `team_members` (feature 004). The API embeds the author's name, role and photo. If the author is unpublished, the name and role still show, but there is no photo and no link to `/about`.
- **Rationale**: This meets FR-007 and the edge case. plan.md's `users` foreign key was rejected: authors are public people, not sign-in accounts.

## R4. Related posts

- **Decision**: SQL scoring over published posts excluding the current one: 2 points per shared tag, plus 1 for the same category. Order by score, then `published_at` descending, with a limit of 3.
- **Rationale**: This meets FR-005.

## R5. Pagination and thin pages

- **Decision**: `/blog?page=n` (12 per page), where each page's canonical is itself and page 1 has no parameter. Category pages paginate the same way. Tag pages with fewer than 2 published posts render `robots: noindex, follow` and are left out of the sitemap. Unknown or empty pages return 404.
- **Rationale**: This meets FR-001 and the thin-content edge case.

## R6. Industry pages

- **Decision**:
  - **Slug**: `{industry}-marketing-{city}`, for example `restaurant-marketing-karachi` (the existing prototype slugs are kept).
  - **Case studies**: either `case_study_industries[]`, an automatic query using 005's list endpoint for each industry, merged and limited to 6 in editor order; or `industry_page_case_studies` (hand-picked, ordered, up to 6). If both are set, the hand-picked list wins.
  - **FAQs**: from `GET /public/faqs?industry={slug}` (006).
  - **JSON-LD**: `WebPage` + `Service` (`serviceType` = the listed services, `areaServed` = the city and country) + `BreadcrumbList`.
- **Rationale**: This meets FR-013–FR-015 and the spec's documented structured-data decision.

## R7. Newsletter double opt-in

- **Decision**: `POST /api/v1/subscribers {email, source_page, turnstile_token}` always returns 202 "Check your inbox":
  - **New email**: create `pending` and send a confirmation.
  - **Pending email**: re-send, if under 3 emails in the last 24 hours.
  - **Confirmed email**: send nothing (FR-018; no enumeration).
  - **Unsubscribed email**: move back to `pending` and send a confirmation.

  Tokens are 256-bit, stored hashed, and valid for 7 days. `/newsletter/confirm?token=` calls `POST /subscribers/confirm`, which is idempotent: a second click shows the same thanks. A per-subscriber unsubscribe token (hashed, no expiry) is in every email, with RFC 8058 `List-Unsubscribe` and `List-Unsubscribe-Post` headers. A daily job deletes `pending` rows older than 30 days. Limits are Turnstile plus slowapi at 5 per IP per hour.
- **Rationale**: This meets FR-016–FR-021. POST-based confirm and unsubscribe (the GET page submits automatically with a button fallback) prevents link-scanner false confirms.
- **Alternatives considered**: A newsletter service (Mailchimp or Resend Audiences) was deferred because sending is out of scope. Subscribers can be synced to a service later.

## R8. CV storage and access

- **Decision**: `POST /api/v1/roles/{slug}/applications` (multipart) runs these checks:
  - Turnstile and the per-IP limit;
  - the role is open and not past its closing date;
  - the size (at most 5 MB, checked while streaming);
  - the file starts with `%PDF-` and `pypdf` can open it without error;
  - no existing application for `(role_id, lower(email))`, which returns 409 `already_applied`.

  The CV is uploaded to Cloudinary as `resource_type=raw, type=authenticated` in `buzzcrew/{env}/cvs/`. Admins download through `GET /api/v1/admin/applications/{id}/cv`, which returns a 60-second signed URL. The applicant gets a confirmation email, and admins get a notification without the attachment.
- **Rationale**: This meets FR-027–FR-030 and SC-005. The same private-file mechanism is reused by feature 011 (reports and invoices).
- **Alternatives considered**: Storing PDFs in Postgres was rejected (it bloats backups). Vercel Blob was rejected because its private access model is weaker than authenticated Cloudinary delivery for this use.

## R9. Roles open, closed and expired

- **Decision**: `job_roles.status` is `draft`, `published` or `closed`, and `closing_date` is optional. A role is **open** when `status = published AND (closing_date IS NULL OR closing_date >= today in Asia/Karachi)`. A daily job sets expired roles to `closed` and revalidates the `roles` tag. Closed or expired role pages render "This role is no longer open" with links to open roles, `noindex`, and are left out of the sitemap and JSON-LD.
- **Rationale**: This meets FR-025, FR-026 and the "closing date passes while filling in the form" edge case, because the API re-checks at submission.

## R10. JobPosting structured data

- **Decision**: `JobPosting` with `title`, `description` (HTML from Markdown), `datePosted`, `validThrough` (closing date, when set), `employmentType` (FULL_TIME, PART_TIME or INTERN), `hiringOrganization` and `jobLocation` (Karachi). For remote roles, `jobLocationType: TELECOMMUTE` plus `applicantLocationRequirements`.
- **Rationale**: This meets the FR-026 structured data requirement.

## R11. Theme

- **Decision**: `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem` and `disableTransitionOnChange`. Its inline script prevents a flash of the wrong theme. Colour tokens are defined as CSS variables for `:root` and `.dark` in `globals.css`, and Tailwind v4 `@theme` maps utilities to the variables. `ThemeSwitch` is a labelled radio group (Light, Dark, System) in the header and mobile menu. If storage is blocked, the theme follows the system (the next-themes fallback). The admin area uses the same provider. Playwright runs `@axe-core/playwright` with the `color-contrast` rule on key pages in both themes.
- **Rationale**: This meets FR-031, FR-032 and SC-007. The Next.js docs' "preventing flash before hydration" guidance is satisfied by next-themes' blocking script.

## R12. FAQ page

- **Decision**: `/faq` fetches `GET /public/faqs` (006) and groups by topic in a fixed order. Each item is `<details><summary>`, which is natively keyboard- and screen-reader-operable and expands on Enter or Space. There is one FAQPage JSON-LD for all visible items. The tag is `faqs`, revalidated by the 004 webhook.
- **Rationale**: This meets FR-022–FR-024. The storage decided in 006 already satisfies FR-023's reuse requirement: self-contained question and answer, topic, services, industries, status and updated_at.

## R13. Applications retention

- **Decision**: `APPLICATION_RETENTION_DAYS` is configuration (default unset, so nothing is deleted) until feature 002's retention decision is made. Admins can delete an application, including the CV file, at any time.
- **Rationale**: The spec defers the period to the privacy policy; this plan doesn't invent one.
