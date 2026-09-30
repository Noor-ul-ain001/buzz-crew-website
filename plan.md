Plan commands
One /speckit.plan command per feature, run on that feature's branch after its spec is clarified. Unlike the specify prompts, these name the stack and technical approach, following constitution v1.0.0.
Shared stack
Every plan command below assumes this baseline from the constitution; each command adds only what its feature needs. Library choices marked "or" are open decisions to settle in the first plan.
Layer
Choice
Frontend
Next.js App Router, TypeScript strict, Tailwind CSS, React Hook Form + Zod
Backend
FastAPI, Python 3.12+, SQLModel, Alembic migrations, uv, Ruff, Pyright
Database
Neon Postgres, separate branches for dev, preview and production
API contract
Routes under /api/v1, OpenAPI schema generates frontend types with openapi-typescript
Testing
pytest + FastAPI TestClient, Vitest + Testing Library, Playwright
Hosting
Vercel (web), Railway or Render (api)
Services
Resend (email), Cloudflare Turnstile, Cloudinary or Vercel Blob (media), Sentry
Repository layout: web/ and api/ in one repo, with api/app/{routers,models,services,core} and api/tests.
Phase 1: Lead capture
001-lead-inquiry
/speckit.plan This is the first feature, so also set up the monorepo: web/ (Next.js App Router, TypeScript strict, Tailwind CSS) and api/ (FastAPI, Python 3.12+, managed with uv, linted with Ruff, type-checked with Pyright). Database is Neon Postgres accessed through SQLModel, with Alembic for migrations from day one.

Backend:
- Table `leads`: id, name, email, phone (nullable), business (nullable), country (enum: pakistan, uae, uk, other), services (text array), budget_range (enum), message, status (enum, default new), source (default "contact_form"), created_at, updated_at (UTC, timezone-aware).
- Endpoint POST /api/v1/leads validates with Pydantic, verifies the Cloudflare Turnstile token server-side, saves the lead, then sends two emails through Resend as a FastAPI background task: a team notification and a client confirmation. Email failure must not fail the request; log it with the lead id only.
- Rate limit POST /api/v1/leads per IP (slowapi or equivalent), returning 429.
- CORS allowlist from environment (CLIENT_URL), never "*".
- Structure: routers/leads.py, models/lead.py, services/lead_service.py, services/email_service.py, core/config.py, core/database.py.

Frontend:
- Generate API types from the FastAPI OpenAPI schema with openapi-typescript into web/lib/api/.
- InquiryForm client component using React Hook Form + Zod, reused on /contact and in a modal opened by every "Start a project" button.
- Turnstile widget, inline errors, loading, success and error states.
- Floating WhatsApp button (wa.me link with encoded pre-filled message; number from env).
- Dev: Next.js rewrites /api/* to the FastAPI server.

Testing (write first): pytest for validation, Turnstile failure, rate limit and email-failure-still-saves; Vitest for the form; Playwright for submit-inquiry happy path with Turnstile test keys and a mocked email provider.
002-seo-foundation
/speckit.plan Frontend-only feature in web/, plus health and error monitoring on both apps.

- Metadata: root layout sets metadataBase, default title template ("%s | The Buzz Crew"), description and Open Graph defaults via the Next.js Metadata API; each route exports its own metadata or generateMetadata.
- Generate app/sitemap.ts and app/robots.ts; the sitemap lists only public routes and will later include published dynamic content fetched from the API.
- Structured data: JSON-LD for Organization and LocalBusiness (Karachi address, service areas Pakistan, UAE, UK) in the root layout.
- Open Graph images with next/og (opengraph-image.tsx) using brand fonts and colours.
- Legal pages: /privacy and /terms as static MDX or TSX pages, linked from the footer and the inquiry form.
- Domain: configure the primary custom domain in Vercel with a permanent redirect from the other address; document the DNS steps in quickstart.md.
- Analytics: Vercel Analytics (or GA4) with custom events inquiry_submitted and whatsapp_clicked, using a small typed track() helper.
- Error monitoring: Sentry for Next.js and FastAPI with a beforeSend hook that strips request bodies, emails and phone numbers.
- API: GET /api/v1/health (liveness) and GET /api/v1/health/ready (checks database).

Testing: a Playwright check that each key page has a unique title, description and canonical tag; a unit test for the Sentry scrubber; Lighthouse CI on home and contact with SEO and Accessibility thresholds of 90.
Phase 2: Admin
003-admin-auth
/speckit.plan Authentication is owned by FastAPI; Next.js only forwards cookies and guards routes.

Backend:
- Tables: `users` (id, email unique, password_hash, name, role enum admin|editor|client, is_active, last_login_at, timestamps), `invitations` (id, email, role, token_hash, expires_at, accepted_at), `password_resets` (id, user_id, token_hash, expires_at, used_at).
- Password hashing with Argon2 (pwdlib or argon2-cffi). Tokens stored only as hashes.
- Sessions: short-lived access JWT plus refresh token, both in httpOnly, Secure, SameSite=Lax cookies; refresh rotates the token. Idle timeout via refresh expiry.
- Endpoints: POST /api/v1/auth/login, /logout, /refresh, /password-reset/request, /password-reset/confirm, /invitations/accept; GET /api/v1/auth/me. Admin-only: GET/POST/PATCH /api/v1/users, POST /api/v1/invitations.
- FastAPI dependencies get_current_user and require_role("admin") applied to every protected router.
- Login rate limit per IP and per email; generic error message for wrong email or password.
- CLI command (uv run) to create the first admin.
- Emails (invite, reset) via Resend.

Frontend:
- /admin/login, /admin/reset-password, /admin/accept-invite pages.
- middleware.ts redirects unauthenticated /admin/* requests to /admin/login; server components call /auth/me for role checks.
- /admin layout with sidebar navigation that hides items the role cannot access (UI only; the API still enforces).
- /admin/users page for admins.

Testing (first): pytest for login success/failure, lockout, role enforcement on every protected route (editor gets 403 on leads), deactivated user, expired and reused tokens. Playwright: admin login and logout.
004-leads-manager
/speckit.plan Builds on the leads table from 001 and auth from 003. All endpoints require role admin.

Backend:
- Migration: add `lead_notes` (id, lead_id FK, author_id FK, body, created_at) and `lead_events` (id, lead_id, actor_id, type enum status_changed|note_added|exported|deleted, from_status, to_status, created_at).
- Endpoints: GET /api/v1/leads (search q, filters status/service/country/date_from/date_to, cursor pagination, sort newest first), GET /api/v1/leads/{id} (with notes and events), PATCH /api/v1/leads/{id}/status, POST /api/v1/leads/{id}/notes, GET /api/v1/leads/export.csv (same filters, streamed response), DELETE /api/v1/leads/{id} (hard delete of lead, notes and events; records an anonymised deletion event), GET /api/v1/leads/stats (per-month counts, conversion rate, top services, by-country) using SQL aggregates.
- Indexes on status, created_at, country; trigram or ILIKE search on name, email, business.
- Meta Conversions API: on lead creation, a background task sends a Lead event with SHA-256-hashed email and phone and an event_id shared with the browser Pixel for deduplication. Only when consent was given (consent flag stored on the lead).

Frontend:
- /admin/leads: server-rendered table with filters in URL search params, status badges, pagination.
- /admin/leads/[id]: details, status select, notes thread, event history, delete with typed confirmation.
- /admin (overview): stat cards and simple charts (Recharts or similar).
- Meta Pixel loaded only after consent (a lightweight consent banner storing the choice), firing Lead with the same event_id.

Testing (first): pytest for filters, pagination, status transitions and event logging, CSV contents, hard delete, stats accuracy against seeded data, 403 for editors. Playwright: change a lead's status and add a note.
Phase 3: Proof of work
005-content-manager
/speckit.plan Establish the reusable publishing pattern that case studies and blog posts will also use. Endpoints for writing require role admin or editor.

Backend:
- Tables: `media` (id, url, provider_public_id, alt_text, width, height, mime_type, size_bytes, uploaded_by, created_at), `testimonials` (id, name, role, company, country, quote, photo_id FK media, video_url, is_published, sort_order, timestamps, deleted_at), `client_logos` (id, name, logo_id FK media, website_url, sort_order, is_published), `team_members` (id, name, role, bio, photo_id, sort_order, is_published).
- Shared mixin for is_published, published_at, deleted_at (soft delete).
- Media: POST /api/v1/media validates MIME (jpeg, png, webp) and size (for example 5 MB), uploads to Cloudinary (or Vercel Blob) from the backend, stores metadata; alt_text required before an item referencing it can publish.
- CRUD endpoints per content type under /api/v1/admin/... plus public read-only endpoints under /api/v1/public/... returning only published, non-deleted items.
- After publish/unpublish, call a Next.js revalidation webhook (POST /api/revalidate with a shared secret) for the affected tags.

Frontend:
- Public pages fetch with Next.js fetch cache tags (testimonials, client-logos, team) so revalidation updates them without redeploying.
- /admin/content/testimonials, /logos, /team: list with drag-to-reorder, create/edit forms with image upload and preview, Save draft and Publish buttons.
- next/image configured for the media provider's domain.

Testing (first): pytest for publish rules (no alt text, no publish), soft delete hidden from public endpoints, upload type and size rejection, role access. Vitest for the upload component. Playwright: publish a testimonial and see it on the homepage.
006-case-studies
/speckit.plan Reuses media, publishing and revalidation from 005.

Backend:
- Table `case_studies`: id, slug unique, title, client_name, industry (enum), country, services (array), challenge, strategy, execution (rich text stored as Markdown or sanitized HTML), cover_id FK media, before_image_id, after_image_id (nullable), testimonial_id (nullable), seo_title, seo_description, is_published, published_at, timestamps, deleted_at.
- Table `case_study_results`: id, case_study_id, label, value, unit, sort_order. Publishing requires at least one row.
- Table `case_study_media`: id, case_study_id, media_id or video_url, sort_order.
- Public: GET /api/v1/public/case-studies?industry=&service= and GET /api/v1/public/case-studies/{slug}. Admin CRUD with a preview token for drafts.
- Slugs generated from title, unique, editable, and stable once published.

Frontend:
- /work index with filters as URL search params (shareable), server-rendered.
- /work/[slug] with generateStaticParams plus ISR, generateMetadata, CreativeWork JSON-LD, dynamic OG image, results displayed as stat blocks, inquiry CTA.
- Before/after slider as an accessible client component (range input under the hood for keyboard and touch).
- /admin/content/case-studies editor with results repeater, media gallery and preview link.
- Add published case studies to sitemap.ts.

Testing (first): pytest for publish-without-results rejection, filters, slug uniqueness, draft invisibility. Vitest for the slider keyboard behaviour. Playwright: filter by industry, open a case study, start an inquiry.
007-service-pages
/speckit.plan Mostly frontend. Service content is stable and written by the team, so keep it in the repo rather than the database.

- Service content in web/content/services/*.mdx (or typed TS objects) with frontmatter: slug, title, summary, audience, deliverables, faqs, related_services, seo fields.
- Routes: /services (overview) and /services/[slug] with generateStaticParams for the five services, generateMetadata, Service and FAQPage JSON-LD.
- Process section rendered from a shared component for the four stages.
- Related case studies: fetch GET /api/v1/public/case-studies?service={slug}&limit=3 with a cache tag so new case studies appear after revalidation.
- Discovery call booking: Cal.com (or Calendly) inline embed on /contact and in the inquiry success state; booking link from env; track a call_booked analytics event.
- /team page reading published team members from 005.
- Add all new routes to the sitemap and navigation.

Testing: Playwright checks that each service page renders, has unique metadata and shows the booking embed; Lighthouse CI thresholds apply to one service page.
Phase 4: Content and SEO
008-blog
/speckit.plan Reuses the publishing pattern, media and revalidation from 005.

Backend:
- Tables: `posts` (id, slug, title, excerpt, body_markdown, cover_id, author_id FK users, category_id, reading_minutes computed on save, seo_title, seo_description, is_published, published_at, timestamps, deleted_at), `categories` (id, slug, name), `tags` (id, slug, name), `post_tags` (post_id, tag_id).
- `industry_pages` (id, slug, industry enum, city, title, intro, body_markdown, seo fields, is_published).
- `faqs` (id, question, answer, category, sort_order, is_published): also the source for the future chatbot.
- `subscribers` (id, email unique, status enum pending|active|unsubscribed, confirm_token_hash, unsubscribe_token_hash, created_at, confirmed_at).
- `job_openings` (id, slug, title, type, location, description, is_open) and `job_applications` (id, job_id, name, email, phone, cv_media_id, cover_note, created_at); CV uploads PDF only, size-limited, stored privately; applications admin-only.
- Endpoints: public read endpoints for posts (with category/tag filters and pagination), industry pages, FAQs, openings; POST /api/v1/subscribers (Turnstile + rate limit, sends confirmation email), GET confirm and unsubscribe endpoints; POST /api/v1/jobs/{slug}/apply; admin CRUD for all.
- Markdown rendered to sanitized HTML on the backend (or sanitized on render in Next.js); never trust raw HTML.

Frontend:
- /blog, /blog/[slug], /blog/category/[slug], /blog/tag/[slug] with ISR, generateMetadata, Article JSON-LD, related posts by shared tags, end-of-post CTA.
- /industries/[slug] pages linking to relevant services and case studies.
- /faq with FAQPage JSON-LD; /careers and /careers/[slug] with the application form.
- Newsletter form in the footer.
- Dark mode with next-themes: system default plus toggle; colours via CSS variables in the Tailwind config; verify contrast in both themes.
- Admin editors for posts (Markdown editor with preview), industry pages, FAQs, openings, applications list and subscribers list.
- Add all published content to sitemap.ts.

Testing (first): pytest for double opt-in flow, unsubscribe, CV type rejection, application access control, draft invisibility. Playwright: read a post, subscribe (mocked email), apply for a job. Axe accessibility checks in light and dark themes.
Phase 5: AI tools
009-ai-chatbot
/speckit.plan RAG chatbot served entirely from FastAPI; no AI keys in the browser.

Backend:
- Enable the pgvector extension on Neon. Table `knowledge_chunks`: id, source_type (service|faq|case_study|industry|pricing), source_id, content, embedding vector, updated_at.
- Ingestion service: on publish/update of FAQs, case studies, industry pages and service content, re-chunk and re-embed only the changed source. Embeddings from a dedicated provider (for example Voyage AI or OpenAI embeddings). Admin endpoint to trigger a full re-index.
- Chat: POST /api/v1/chat accepts session_id and message, retrieves top-k chunks by cosine similarity with a relevance threshold, calls the Anthropic Claude API (Python SDK) with a system prompt restricting answers to retrieved context, forbidding invented prices, deadlines or guarantees, and requiring a decline plus contact offer when context is insufficient. Stream the response (server-sent events).
- Guardrails: max input length, max output tokens, request timeout, per-session and per-IP daily limits, fallback message with contact options on provider error.
- Tables: `chat_sessions` (id, created_at, ip_hash, lead_id nullable), `chat_messages` (id, session_id, role, content, created_at). Retain for a limited period; no raw IPs.
- Handoff: POST /api/v1/chat/{session_id}/handoff generates a short summary (Claude) and attaches it to the lead created by the inquiry form.

Frontend:
- Chat widget client component, lazy-loaded after page interaction to protect performance; labelled "AI assistant"; notice not to share sensitive data; streaming display; buttons for "Talk to the team" (opens inquiry form pre-filled with the summary) and WhatsApp.
- Admin: /admin/chat shows sessions that converted, with summaries.

Testing (first): pytest with a mocked Claude client and fixed embeddings: retrieval threshold, out-of-scope decline, rate limits, provider-failure fallback, handoff summary saved on the lead. An evaluation set of 20-30 question/expected-behaviour pairs run in CI against the prompt.
010-seo-audit-tool
/speckit.plan Backend-driven audit with an AI summary grounded only in measured data.

Backend:
- POST /api/v1/audits accepts a URL; validate scheme (http/https), resolve the host and block private, loopback and link-local IP ranges to prevent SSRF; Turnstile + per-IP daily limit.
- Run as a background job (FastAPI background task or a simple job table polled by the client): call the Google PageSpeed Insights API (mobile) for performance, SEO and accessibility scores and Core Web Vitals; fetch the page HTML with httpx (timeout, size cap, redirects limited) and parse with selectolax or BeautifulSoup for title, meta description, H1/H2 structure, images missing alt, viewport tag, canonical.
- Claude generates a plain-language summary of the top 3-5 fixes from a structured JSON of results only; validate the output against a Pydantic schema before storing.
- Table `audits`: id, url, status (queued|running|done|failed), scores JSON, checks JSON, summary, email (nullable), lead_id (nullable), created_at. Store results, not page content.
- GET /api/v1/audits/{id} for polling; POST /api/v1/audits/{id}/email captures name and email, creates a lead with source=seo_audit, and emails the full report via Resend.

Frontend:
- /tools/seo-audit page: URL form, progress state, results with score dials and a checklist, summary, and "Email me the full report" form. Report page at /tools/seo-audit/[id] marked noindex.

Testing (first): pytest for SSRF blocking, invalid/unreachable URLs, parser checks on fixture HTML, mocked PageSpeed and Claude responses, lead creation on email capture. Playwright happy path with mocks.
011-ai-admin-assist
/speckit.plan Admin AI helpers plus two public tools. All AI calls from FastAPI with the same guardrails as 009.

Backend:
- Lead scoring: on lead creation, a background task asks Claude for {priority: hot|warm|cold, reason} via structured output; validate with Pydantic; store in `lead_ai_insights` (lead_id, priority, reason, model, created_at). Never modify lead status.
- Proposal drafts: POST /api/v1/leads/{id}/proposal-draft (admin) generates Markdown from lead details, services content and an admin-maintained proposal template; stored in `proposal_drafts` (id, lead_id, body_markdown, created_by, edited_at). No sending endpoint.
- Caption generator: POST /api/v1/tools/captions (public) with business_type, goal, platform; returns ideas and captions as validated JSON; Turnstile + daily limit.
- Cost estimator: table `price_ranges` (service, scope enum, min_pkr, max_pkr, currency notes) managed by admins; POST /api/v1/tools/estimate computes a range purely from this table (no AI); "Send as inquiry" creates a lead with source=estimator and the selections attached.

Frontend:
- Lead detail shows the priority badge and reason; "Generate proposal draft" opens an editor with copy and download (.md or .docx export).
- /tools/captions and /tools/estimate public pages; /admin/settings/pricing editor.

Testing (first): pytest confirms scoring never changes status, invalid AI output is rejected, estimates match configured ranges exactly, public limits enforced; mocked Claude throughout.
Phase 6: Client portal
012-client-portal
/speckit.plan Extends auth from 003 with the client role and organisation-scoped access. Tenant isolation is the top risk; enforce it in one place.

Backend:
- Tables: `organisations` (id, name, country, timestamps), `organisation_members` (user_id, organisation_id), `projects` (id, organisation_id, name, services, stage enum discovery|strategy|execution|reporting, started_at, timestamps), `reports` (id, project_id, period_month, file_media_id, uploaded_by, created_at), `approval_items` (id, project_id, title, description, media_id or link, status enum pending|approved|changes_requested, submitted_by, timestamps), `approval_comments` (id, item_id, author_id, body, created_at), `approval_decisions` (id, item_id, decided_by, decision, created_at), `invoices` (id, organisation_id, number, amount, currency, due_date, status enum unpaid|paid|overdue, file_media_id, timestamps).
- A get_client_org dependency resolves the user's organisation; every client query filters by organisation_id through a shared scoped-query helper, never by IDs from the request alone. Accessing another organisation's resource returns 404.
- Client endpoints under /api/v1/portal/...; admin endpoints under /api/v1/admin/organisations, /projects, /reports, /approvals, /invoices.
- Private files (reports, invoices) stored in private storage and served through short-lived signed URLs issued after an access check.
- Invitations reuse 003 with role=client and organisation_id. Resend emails for new reports and new approval items.
- Overdue status computed daily (scheduled job) or on read.

Frontend:
- /portal area with its own layout: dashboard (projects and stage tracker), /portal/projects/[id], reports list, approvals with approve/request-changes and comments, invoices list.
- Admin screens to manage organisations, members, projects, reports, approvals and invoices.
- i18n with next-intl for public pages: locale routing (/en, /ur, /ar), message files, hreflang alternates in metadata, dir="rtl" on the html element for Arabic and Urdu, Tailwind logical properties (ms-/me-, ps-/pe-) so layouts mirror correctly. Portal can stay English-only initially.

Testing (first): pytest cross-tenant tests for every portal endpoint (client A cannot read or modify client B's projects, reports, approvals, invoices, including by guessing IDs), signed URL expiry, deactivated client access, decision history. Playwright: client logs in, approves an item, downloads a report; locale switch renders RTL for Arabic.