<!--
Sync Impact Report
- Version change: (none) → 1.0.0
- Modified principles: N/A (initial ratification)
- Added sections: Core Principles (I–X), Technology Stack & Architecture Constraints,
  Security & Data Handling Standards, Performance & Quality Standards,
  Development Workflow & Quality Gates, Governance
- Removed sections: None
- Templates: not modified by this command. plan-template.md, spec-template.md and
  tasks-template.md read this constitution at runtime (Constitution Check gates are
  derived from Principles I–X when /speckit-plan runs).
- Follow-up TODOs:
  - Repository layout: the constitution requires web/ + api/; the current repo is a
    single Next.js app at the root. Restructure via a dedicated feature.
  - GET /api/health sits outside the /api/v1 prefix rule; treated as an intentional
    operational exemption.
-->

# The Buzz Crew Website Constitution

The Buzz Crew website is the public face and lead-generation engine of a full-service
digital agency based in Karachi, serving clients in Pakistan, the UAE and the UK. It
consists of a Next.js frontend and a Python (FastAPI) backend backed by Neon Postgres. Its
purpose is to present the agency's work, capture and manage leads, publish SEO content,
and host AI-powered tools. Every decision in this project MUST serve those goals.

## Core Principles

### I. Spec-Driven Development (NON-NEGOTIABLE)

- Every feature MUST begin with a specification (`/speckit.specify`) that describes the
  user value and acceptance criteria before any implementation plan or code exists.
- Specifications MUST describe what and why; technology choices belong in the plan
  (`/speckit.plan`), not the spec.
- Ambiguities MUST be resolved through `/speckit.clarify` or marked
  `[NEEDS CLARIFICATION]`; implementation MUST NOT proceed while clarification markers
  remain.
- Each feature MUST live on its own branch (`###-feature-name`) with its artifacts in
  `specs/###-feature-name/` (spec, plan, research, data model, contracts, tasks).
- Code that is not traceable to a task in an approved `tasks.md` MUST NOT be merged.

**Rationale**: The site will grow from a brochure into a platform (admin, client portal,
AI tools). Specs keep that growth deliberate and reviewable.

### II. SEO and Performance First

- All public, indexable pages MUST be server-rendered or statically generated (Server
  Components, SSG or ISR). Client-only rendering is permitted only for interactive
  widgets and authenticated areas.
- Every public page MUST define a unique title, meta description, canonical URL and Open
  Graph data through the Next.js Metadata API.
- The site MUST ship and maintain `sitemap.xml`, `robots.txt` and structured data
  (Organization / LocalBusiness, plus Article for blog posts and CreativeWork for case
  studies).
- Images MUST use `next/image` with explicit dimensions and descriptive alt text.
- URLs MUST be human-readable, lowercase and hyphenated (e.g. `/work/discovery-homes`,
  `/services/meta-ads`).

**Rationale**: The agency sells SEO. Its own website is the first proof of competence.

### III. Contract-First API

- The FastAPI backend is the single source of truth for the API contract. Every endpoint
  MUST declare Pydantic/SQLModel request and response models so the generated OpenAPI
  schema is complete and accurate.
- Frontend API types MUST be generated from the OpenAPI schema (e.g. openapi-typescript),
  not written by hand. Regenerating types is part of any task that changes an endpoint.
- All endpoints MUST live under `/api/v1/…`. Breaking changes require a new version
  prefix; the previous version stays available until the frontend no longer uses it.
- Errors MUST use a consistent shape (FastAPI's `detail` format) with correct HTTP status
  codes (400/401/403/404/409/422/429/500). Internal details and stack traces MUST NOT
  reach clients.
- Contracts for each feature MUST be written in `specs/###-feature/contracts/` before the
  endpoint is implemented.

**Rationale**: Two languages across one boundary is where bugs hide. A generated, shared
contract removes an entire class of mismatches.

### IV. Test-First for Business Logic

- Backend business logic and every API endpoint MUST follow Red-Green-Refactor: tests are
  written, confirmed failing, then implementation makes them pass.
- Required test layers:
  - **Backend (pytest)**: unit tests for services and validation; API tests using
    FastAPI's TestClient against an isolated test database; contract tests confirming
    response shapes.
  - **Frontend (Vitest + Testing Library)**: components containing logic (forms,
    filters, estimators).
  - **End-to-end (Playwright)**: critical user journeys — submitting an inquiry, admin
    login, updating a lead's status, and any payment or approval flow added later.
- Tests MUST NOT call real third-party services (email, AI providers, Neon production).
  These MUST be mocked or pointed at test instances.
- A bug fix MUST include a regression test that fails before the fix.

**Rationale**: Leads are revenue. A silently broken inquiry form is the most expensive bug
this site can have.

### V. Security and Lead Data Privacy (NON-NEGOTIABLE)

- Lead, client and applicant data is confidential. It MUST only be readable through
  authenticated, authorized admin endpoints.
- Every non-public endpoint MUST enforce authentication and role checks on the server.
  Hiding UI elements is not authorization.
- Secrets (database URLs, API keys, JWT secrets) MUST come from environment variables and
  MUST NOT be committed. `.env.example` files document required variables without real
  values.
- Personally identifiable information (names, emails, phone numbers, messages) MUST NOT be
  written to logs, analytics events or error-tracking payloads.
- See Security & Data Handling Standards below for mandatory controls.

**Rationale**: Clients trust the agency with their business details. A leak would damage
the brand the website exists to build.

### VI. Type Safety End to End

- TypeScript MUST run in strict mode. `any` is prohibited except at documented
  third-party boundaries, which MUST be wrapped and narrowed immediately.
- Python code MUST be fully type-hinted and pass a type checker (Pyright or mypy) in CI.
- All external input (request bodies, query params, environment variables, AI model
  output) MUST be validated at the boundary: Pydantic on the backend, Zod on the frontend
  where data is not produced by the generated API types.

**Rationale**: Types catch contract drift and edge cases before users do.

### VII. Accessible and Responsive by Default

- All UI MUST meet WCAG 2.1 Level AA: semantic HTML, keyboard navigation, visible focus
  states, sufficient color contrast, labelled form fields and meaningful alt text.
- Layouts MUST be mobile-first. Most traffic from social media and Meta Ads arrives on
  phones.
- Animations MUST respect `prefers-reduced-motion`.
- Forms MUST show clear inline validation errors and loading, success and error states.

**Rationale**: Accessibility widens the audience and is a signal search engines reward.

### VIII. Simplicity and YAGNI

- Build the simplest solution that satisfies the spec. Abstractions, extra services,
  queues or caches MUST be justified in the plan's Complexity Tracking table.
- The architecture is exactly two deployable units (`web/` and `api/`). Adding a third
  service requires a constitution amendment.
- Prefer managed services (Neon, Vercel, Resend, Cloudinary) over self-hosted
  infrastructure.
- Prefer built-in framework features (Next.js Metadata API, FastAPI dependencies) over
  third-party libraries doing the same job.

**Rationale**: A small team maintains this site alongside client work. Every moving part
is a maintenance cost.

### IX. Responsible AI Features

- AI features (chatbot, SEO audit tool, lead scoring, proposal drafts) MUST run on the
  backend. Provider API keys MUST never reach the browser.
- AI output shown to visitors MUST be clearly identified as AI-generated. The chatbot MUST
  offer a handoff to a human (inquiry form or WhatsApp).
- AI MUST NOT make final decisions about leads or clients. Scores and drafts are
  suggestions that a team member reviews.
- Retrieval-augmented features MUST answer only from approved agency content (services,
  FAQs, pricing ranges) and MUST decline questions outside that scope rather than
  inventing answers, prices or commitments.
- Every AI endpoint MUST have rate limits, request timeouts, a maximum token budget, and a
  graceful fallback when the provider fails.
- Model output MUST be validated against a schema before being stored or rendered.

**Rationale**: An AI that promises a price or deadline the agency cannot meet is a
liability, not a feature.

### X. Observability and Operability

- The backend MUST emit structured (JSON) logs with a request ID that is propagated from
  the frontend where possible.
- Unhandled errors on both frontend and backend MUST be reported to an error-tracking
  service (e.g. Sentry), with PII scrubbed per Principle V.
- The API MUST expose `GET /api/health` (liveness) and verify database connectivity in a
  readiness check.
- Key business events (lead created, lead status changed, audit tool used) MUST be
  recorded so conversion can be measured.

**Rationale**: "Measurable growth" is an agency promise. The site must measure itself.

## Technology Stack & Architecture Constraints

### Frontend (`web/`)

- **Framework**: Next.js, App Router, TypeScript (strict)
- **Styling**: Tailwind CSS with design tokens (colors, typography, spacing) defined once
- **Data fetching**: Server Components for public content; generated API client for
  mutations
- **Forms**: React Hook Form + Zod
- **Hosting**: Vercel
- **Analytics**: Vercel Analytics or GA4, plus Meta Pixel (see consent rules below)

### Backend (`api/`)

- **Framework**: FastAPI, Python 3.12+
- **ORM / models**: SQLModel (SQLAlchemy + Pydantic)
- **Migrations**: Alembic. `SQLModel.metadata.create_all` is permitted only in local
  development and tests, never in production.
- **Package management**: uv (preferred) or pip with a pinned `requirements.txt`
- **Lint / format**: Ruff
- **Hosting**: Railway or Render (or an equivalent managed container platform)

### Data and services

- **Database**: Neon Postgres, with separate branches for development, preview and
  production
- **Email**: Resend (or SMTP) for notifications and auto-replies
- **Media storage**: Cloudinary or Vercel Blob
- **Bot protection**: Cloudflare Turnstile on public forms
- **AI providers**: Anthropic Claude API and/or OpenAI, accessed only from the backend

### Communication between frontend and backend

- In development, Next.js rewrites `/api/*` to the FastAPI server.
- In production, the frontend calls the API through the configured `API_URL`; FastAPI
  CORS MUST allow only the production and preview frontend origins, never `*`.

### Repository structure

```text
buzz-crew/
├── .specify/            # Spec Kit memory, scripts, templates
├── specs/               # One folder per feature: spec, plan, contracts, tasks
├── web/                 # Next.js app
│   ├── app/             # Routes (public, /admin, /portal)
│   ├── components/
│   └── lib/             # Generated API types and client
└── api/                 # FastAPI app
    ├── app/
    │   ├── routers/     # One router per resource
    │   ├── models/      # SQLModel tables and schemas
    │   ├── services/    # Business logic (no HTTP concerns)
    │   └── core/        # Config, database, security
    ├── alembic/
    └── tests/
```

### Data model conventions

- Table names are plural snake_case (`leads`, `case_studies`, `blog_posts`).
- Every table has `id`, `created_at` and `updated_at` (UTC, timezone-aware).
- Status fields use constrained values (Enum), never free text.
- Content tables (case studies, posts, testimonials) include `slug` (unique) and
  `is_published`.
- Deletions of business records use soft delete (`deleted_at`) unless the data subject
  requested erasure, in which case the data MUST be hard-deleted.

## Security & Data Handling Standards

- **Authentication**: Admin and client-portal sessions use short-lived JWTs (or a vetted
  auth library) stored in httpOnly, Secure, SameSite=Lax cookies. Tokens MUST NOT be
  stored in localStorage.
- **Passwords**: hashed with Argon2 or bcrypt; never logged or returned.
- **Authorization**: role-based (admin, editor, client), enforced in FastAPI dependencies
  on every protected route. Clients can only access their own projects.
- **Rate limiting**: all public write endpoints (inquiry form, newsletter, applications,
  AI tools) MUST be rate-limited per IP.
- **Input handling**: all input validated by Pydantic; all queries through the ORM or
  bound parameters; user-supplied HTML MUST be sanitized before rendering.
- **File uploads**: allowlisted MIME types and size limits; files stored in object
  storage, never on the API server's disk.
- **Security headers**: Content-Security-Policy, HSTS, X-Content-Type-Options and
  Referrer-Policy configured on the frontend.
- **Dependencies**: automated dependency and vulnerability scanning (e.g. Dependabot)
  enabled for both `web/` and `api/`.
- **Privacy**: a published privacy policy MUST describe what lead data is collected and
  why. Tracking pixels that are not strictly necessary load only after consent where the
  visitor's jurisdiction requires it (for example, visitors from the UK).
- **Data requests**: the admin panel MUST support exporting and deleting a person's data
  on request.

## Performance & Quality Standards

- **Core Web Vitals** (mobile, 75th percentile): LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.
- **Lighthouse** (mobile) on key pages (home, services, case study, blog post, contact):
  ≥ 90 for Performance, Accessibility, Best Practices and SEO.
- **API latency target**: p95 < 300 ms for non-AI endpoints. AI endpoints MUST stream or
  show progress and time out gracefully.
- **Bundle discipline**: new client-side dependencies MUST be justified in the plan;
  prefer Server Components to reduce shipped JavaScript.
- **Content**: user-facing copy MUST be reviewed for spelling, brand voice ("We tell your
  stories") and consistent British/international English.

## Development Workflow & Quality Gates

### Spec Kit flow per feature

1. `/speckit.specify`: write the feature spec (user stories, acceptance criteria).
2. `/speckit.clarify`: resolve ambiguities.
3. `/speckit.plan`: technical plan, data model, contracts; MUST pass the Constitution
   Check.
4. `/speckit.tasks`: ordered tasks, with tests before implementation for backend logic.
5. `/speckit.analyze`: cross-artifact consistency check before implementation begins.
6. `/speckit.implement`: execute tasks.

### Branching and commits

- One branch per feature, created by Spec Kit (`###-feature-name`).
- Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- Direct pushes to `main` are prohibited; all changes merge through pull requests.

### Pull request gates (all MUST pass before merge)

- **Frontend**: ESLint, Prettier, `tsc --noEmit`, Vitest, `next build`
- **Backend**: Ruff (lint + format), Pyright/mypy, pytest
- Generated API types are up to date with the backend OpenAPI schema
- Alembic migration included for any model change, and it runs cleanly on a fresh
  database
- Playwright suite passes for features touching critical journeys
- Vercel preview deployment reviewed for UI changes
- PR description links the feature spec and states how the Constitution Check was
  satisfied

### Deployment

- `main` deploys to production automatically after gates pass.
- Database migrations run before the new API version receives traffic.
- Every production deploy MUST be reversible (previous Vercel deployment and previous API
  image available for rollback).

## Governance

- This constitution supersedes all other project practices, guides and habits. Where a
  document conflicts with it, the constitution wins.
- **Amendments** require: a written proposal stating the change and its rationale,
  approval by the project lead, an updated Sync Impact Report, and a migration plan for
  existing code if the change affects it.
- **Versioning** follows semantic versioning:
  - MAJOR: a principle is removed or redefined in a backward-incompatible way
  - MINOR: a principle or section is added or materially expanded
  - PATCH: wording, clarification or typo fixes with no change in meaning
- **Compliance**: every `plan.md` MUST include a Constitution Check against Principles
  I–X. Any violation MUST be recorded in the plan's Complexity Tracking table with
  justification and the simpler alternative that was rejected. Reviewers MUST reject PRs
  with unjustified violations.
- **Review cadence**: the constitution is reviewed at the start of each major phase (admin
  dashboard, AI features, client portal) and whenever a principle is repeatedly bypassed.
- Runtime development guidance for AI agents lives in the agent context file generated by
  Spec Kit (e.g. `CLAUDE.md`) and MUST stay consistent with this document.

**Version**: 1.0.0 | **Ratified**: 2026-09-27 | **Last Amended**: 2026-09-27
