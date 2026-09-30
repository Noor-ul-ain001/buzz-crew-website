---
description: "Task list for 006 Service Pages, Team Page and Discovery Call Booking"
---

# Tasks: Service Pages, Team Page and Discovery Call Booking

**Input**: `specs/006-service-pages-booking/` (plan, spec, research, data-model, contracts/services-booking.openapi.yaml, quickstart), plus `specs/DEPLOYMENT.md`

**Prerequisites**: 001, 003, 004 (team members, publishing factory) and 005 (public case-study list with the `service` filter) are complete.

**Tests**: Included.

**Cost note**: Cal.com's free plan covers webhooks, reminders, embeds, booking questions and the per-booker limit (checked; see COSTS.md). Nothing paid is used.

---

## Phase 1: Setup

- [ ] T001 Create branch `006-service-pages-booking`; add `@calcom/embed-react` to `web/package.json`; add `NEXT_PUBLIC_CAL_LINK` to `web/.env.example`, and `CAL_WEBHOOK_SECRET` and `CAL_API_KEY` to `api/.env.example`
- [ ] T002 Configure the Cal.com free account (manual; record the settings in `specs/006-service-pages-booking/quickstart.md`):
  - **Event type**: "Discovery call", 30 minutes.
  - **Availability**: Monday–Friday 10:00–18:00 Asia/Karachi, with a 12-hour minimum notice and a 30-day window.
  - **Booking questions**: name, email and country (required); "What would you like to discuss?" (required, at least 10 characters); phone and business (optional).
  - **Workflows**: reminders 24 hours and 1 hour before.
  - **Limits**: upcoming bookings per booker = 2.
  - **Calendar**: the team's calendar connected.
  - **Webhook**: to `{API_ORIGIN}/api/v1/webhooks/cal` for created, rescheduled and cancelled bookings.

---

## Phase 2: Foundational

- [ ] T003 Create `web/content/services/types.ts` (`ServiceContent`: `slug` union `"social-media"|"seo"|"web-software"|"ui-ux-design"|"meta-ads"`; `name`, `headline`, `summary`, `outcome`; `audience: string[]` (≥ 2); `deliverables: string[]` (≥ 3); `process: {discovery, strategy, execution, reporting}`; `seo: {title, description}` "unique; description 70–160 characters"; `relatedServices`), plus `web/content/services/index.ts` exporting all five, with a slug-to-`lead_service` enum map
- [ ] T004 [P] Create the five content modules `web/content/services/{social-media,seo,web-software,ui-ux-design,meta-ads}.ts`, each with `satisfies ServiceContent` and placeholder copy marked `// TODO(agency): final copy`
- [ ] T005 [P] Vitest test in `web/content/services/services.test.ts`: exactly 5 services; unique titles and descriptions; descriptions 70–160 characters; audience ≥ 2; deliverables ≥ 3; all four process steps present

---

## Phase 3: User Story 1 – Understand a service from its own page (P1) 🎯 MVP

**Goal**: Five service pages plus an overview, reachable from the nav and home page, with SEO and FAQs.

**Independent Test**: Each `/services/{slug}` shows the sections in order, at least 4 published FAQs, unique metadata and valid Service, FAQPage and Breadcrumb JSON-LD; "Start a project" pre-selects the service.

- [ ] T006 [P] [US1] Tests in `api/tests/test_faqs.py`: FAQ CRUD through the 004 factory (admin and editor); the public `GET /api/v1/public/faqs?service=seo` returns only published items ordered by topic then `sort_order`; `question` ≤ 200 characters; `answer_md` ≤ 2,000; `topic` enum; the response shape matches the contract
- [ ] T007 [US1] Create the `faqs` table in `api/app/models/faq.py` (+ PublishableMixin): `question` varchar(200), `answer_md` text "≤ 2,000; limited Markdown (links, lists, bold)", `topic` enum `faq_topic` (`working_with_us`,`pricing_approach`,`timelines`,`process`,`services`), `services` `lead_service[]`, `industries` varchar[]. Add an Alembic migration, register the admin routes through the factory (tag `faqs`), and add `api/app/routers/public_faqs.py`.
- [ ] T008 [US1] Wire the existing `web/app/admin/content/faqs/page.tsx` to the API (topic select, services and industries multi-select, publish, reorder)
- [ ] T009 [P] [US1] Create the components `web/components/services/{ProcessSteps,Deliverables,ServiceFaqs,ServiceCta,OtherServices}.tsx`. `ServiceFaqs` renders `<details>`/`<summary>` items with answers through the 005 `MarkdownSection`, restricted to links, lists and bold. `ServiceCta` renders "Start a project" (`openInquiry({ services: [enum] })`) and "Book a discovery call" (anchor to the booking section).
- [ ] T010 [US1] Create `web/app/(site)/services/[slug]/page.tsx`: `generateStaticParams` (the 5 slugs), `generateMetadata`, JSON-LD (Service with provider `@id`, `areaServed` Pakistan, United Arab Emirates and United Kingdom; FAQPage from exactly the rendered FAQs; BreadcrumbList); sections in the FR-002 order; FAQs fetched with tag `faqs`; the build fails if fewer than 4 published FAQs exist for a service in production (`process.env.VERCEL_ENV === "production"`)
- [ ] T011 [US1] Create `web/app/(site)/services/page.tsx` (overview: 1–2 sentence summaries linking to each page)
- [ ] T012 [US1] Add a Services menu (desktop dropdown and mobile list) in `web/components/nav/*`, and link each service from the home services section in `web/app/(site)/page.tsx`; update `NAV_LINKS` in `web/lib/site.ts`
- [ ] T013 [P] [US1] Playwright test in `web/e2e/services.spec.ts`: each service is reachable in 2 interactions from home; unique titles and descriptions; JSON-LD parses; the CTA pre-selects the service

---

## Phase 4: User Story 2 – Book a discovery call (P1)

**Goal**: A booking embed on `/contact`, the service pages and the inquiry confirmation; the webhook creates or links leads.

**Independent Test**: Book through the embed. The Cal.com email arrives, a `discovery_calls` row and a lead with `source=discovery_call` exist (or the booking is linked to the just-submitted inquiry), and the team is emailed. Reschedule and cancel update the row. A third upcoming booking is auto-cancelled.

### Tests

- [ ] T014 [P] [US2] Tests in `api/tests/test_cal_webhook.py`:
  - a bad `X-Cal-Signature-256` returns 401 and stores nothing;
  - `BOOKING_CREATED` creates a lead (`source=discovery_call`, `services=[]`, `budget_range=not_sure`, message from the notes, country from the answer) and a `discovery_calls` row;
  - it links to an existing lead when `metadata.inquiry_id` matches, or when the same email submitted within 24 hours;
  - a repeated delivery with the same `uid` is idempotent;
  - rescheduled and cancelled bookings update `status` and times;
  - a third upcoming booking for one email triggers the cancel call (mocked Cal.com API) and a team flag;
  - the team email is sent inline (DEPLOYMENT D4) and recorded in `email_deliveries` (kind `call_team_notification`).

### Implementation

- [ ] T015 [US2] Create the `discovery_calls` table in `api/app/models/discovery_call.py` per data-model.md: `cal_booking_uid` varchar(100) unique; `lead_id` FK; `status` enum `call_status` (`booked`,`rescheduled`,`cancelled`); `starts_at` and `ends_at` UTC; `attendee_timezone` varchar(64) IANA; `attendee_name` varchar(100); `attendee_email` varchar(254) lower-cased; `attendee_phone` varchar(20) nullable; `business` varchar(150) nullable; `country` `lead_country`; `notes` text "≥ 10 characters"; `source_page` varchar(200); timestamps. Add `discovery_call` to the lead source values, `call_team_notification` to `email_kind`, and an Alembic migration.
- [ ] T016 [US2] Implement `api/app/services/booking_service.py` (upsert by uid, lead create or link, 2-upcoming rule, team email template `api/app/templates/email/call_team_notification.{html,txt}`) and `api/app/routers/webhooks_cal.py` (HMAC verification over the raw body)
- [ ] T017 [US2] Create `web/components/booking/BookCallEmbed.tsx`: lazy-loaded with `next/dynamic` when it scrolls into view (IntersectionObserver) or when "Book a discovery call" is clicked; Cal.com inline embed with `NEXT_PUBLIC_CAL_LINK`; prefill `name`, `email`, `notes` and metadata `source_page` and `inquiry_id`; `bookingSuccessful` fires `track("call_booked", { source_page })`; inquiry and WhatsApp alternatives always rendered alongside
- [ ] T018 [US2] Place `BookCallEmbed` on `web/app/(site)/contact/page.tsx`, on the service pages (T010), and in the success state of `web/components/inquiry/InquiryForm.tsx`, prefilled from the submitted values and the returned lead id
- [ ] T019 [P] [US2] Playwright test in `web/e2e/booking.spec.ts`: the embed iframe renders lazily on `/contact`; the inquiry success state shows the embed with prefill parameters in the iframe URL (without completing a real booking)

---

## Phase 5: User Story 3 – Related case studies on service pages (P2)

**Goal**: Up to 3 case studies per service that update automatically.

**Independent Test**: Publishing an SEO case study shows it on `/services/seo` and not on `/services/ui-ux-design`; a service with none shows the invitation block.

- [ ] T020 [US3] Create `web/components/services/RelatedCaseStudies.tsx`: fetch `GET /api/v1/public/case-studies?service={enum}&page_size=3` with tags `["case-studies"]` and `revalidate: 300`; render `CaseStudyCard`s plus "See all" → `/work?service={slug}`; when empty, render the "Book a call / View all work" invitation block; use it in T010
- [ ] T021 [P] [US3] Playwright check in `web/e2e/services.spec.ts`: with the 005 seed, SEO case studies appear only on the SEO page, and the empty service shows the invitation

---

## Phase 6: User Story 4 – Meet the team (P2)

**Goal**: The `/about` page with published team members.

**Independent Test**: With 2 published members and 1 draft, `/about` shows the 2 in order; with none, it shows the introduction and CTA only.

- [ ] T022 [US4] Create `web/app/(site)/about/page.tsx`: agency introduction; team grid from `GET /api/v1/public/team-members` (tag `team-members`, hidden when empty); CTA to start a project or book a call; metadata, share image, AboutPage and Person (name, jobTitle) JSON-LD
- [ ] T023 [P] [US4] Playwright test in `web/e2e/about.spec.ts`: only published members are shown, in order; an update appears after revalidation

---

## Phase 7: Polish

- [ ] T024 [P] Add `/services`, `/services/[slug]` and `/about` to `web/app/sitemap.ts`
- [ ] T025 [P] Track `service_cta_clicked`, `call_booking_opened` and `call_booked` in `web/lib/analytics.ts` (no PII)
- [ ] T026 [P] Add Cal.com as a processor in the privacy page content `web/app/(site)/privacy/page.tsx` (FR-025)
- [ ] T027 Manual accessibility audit of the Cal.com embed (keyboard and screen reader: are times announced with their time zone?); record the result in `specs/006-service-pages-booking/quickstart.md` (scenario 13). The inquiry and WhatsApp fallbacks remain visible regardless.
- [ ] T028 Run Lighthouse CI on `/services/seo` (SEO and Accessibility ≥ 90) and quickstart scenarios 1–13 on the Vercel Hobby preview

## Dependencies

- **Order**: Setup → Foundational → US1 → US2 (needs T010 for placement) → US3 and US4 in parallel → Polish.
- **US4** only needs 004 and can be done any time after Setup.

## Implementation strategy

**MVP**: US1 (service pages rank and convert) + US2 (booking). Then US3 and US4.
