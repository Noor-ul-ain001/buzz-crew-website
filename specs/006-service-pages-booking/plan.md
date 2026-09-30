# Implementation Plan: Service Pages, Team Page and Discovery Call Booking

**Branch**: `006-service-pages-booking` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-service-pages-booking/spec.md`

## Summary

This feature is mostly front end.

**Service pages**:
- The five services' copy lives in the repo as typed content modules (`web/content/services/*.ts`). It is rendered statically at `/services` and `/services/[slug]`, with unique metadata and Service, FAQPage and Breadcrumb JSON-LD.
- A shared four-step process component renders each service's step descriptions.
- Related case studies come from feature 005's public API (`?service={slug}&page_size=3`), tagged so they refresh when case studies change.
- Service FAQs come from a new `faqs` table managed in the existing admin FAQ screen. This feature introduces the table and its admin CRUD, and feature 007 builds the public FAQ page on it.
- `/about` becomes the team page, fed by feature 004's published team members.

**Discovery calls**: booked through an inline **Cal.com** embed on `/contact`, every service page and the inquiry confirmation. Cal.com provides:
- live availability from the team's calendar and time-zone handling;
- double-booking prevention and calendar invitations;
- reschedule and cancel links, and reminders.

A signed Cal.com webhook to FastAPI (`POST /api/v1/webhooks/cal`) stores each booking, creates or links a lead (`source = discovery_call`), and notifies the team.

## Technical Context

**Language/Version**: TypeScript 5 strict / Next.js 16.3; Python 3.12+

**Primary Dependencies**:
- **web**: `@calcom/embed-react`, `next/og`, feature 005 fetchers, feature 004 team fetcher
- **api**: FastAPI, SQLModel; HMAC verification of Cal.com webhooks

**Storage**: Neon Postgres. New tables `faqs` and `discovery_calls`; `leads` gains source `discovery_call` (enum value from 001). Service copy is stored in git.

**Testing**:
- pytest: webhook signature verification; booking created, rescheduled and cancelled; lead creation versus linking to a recent inquiry from the same email; FAQ CRUD and publish visibility; the 2-upcoming-calls rule; editor access to FAQs.
- Playwright: all service pages render with unique metadata and JSON-LD; the booking embed renders on `/contact` and on the inquiry success state with prefill; `/about` shows only published members.
- Lighthouse CI: one service page.

**Target Platform**: Vercel Hobby (free) for both the `web` and `api` projects (practice project), Cal.com (hosted) — see [DEPLOYMENT.md](../DEPLOYMENT.md) and [COSTS.md](../COSTS.md)

**Project Type**: Web application (`web/` + `api/`) plus a hosted scheduling service

**Performance Goals**: Service pages are statically generated (LCP ≤ 2.5 s). The Cal.com embed script loads only when the booking section is scrolled into view or opened, so it doesn't affect LCP.

**Constraints**:
- Calls are 30 minutes, Monday–Friday 10:00–18:00 PKT, bookable from 12 hours to 30 days ahead.
- Each email address can have at most 2 upcoming calls.
- No accounts are needed for prospects.
- Booking data is admin-only.

**Scale/Scope**: 6 static service routes, 1 team page, 1 webhook, 2 tables.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-driven | No open markers. Depends on 001, 003, 004 and 005 (planned). Feature 002 is not yet planned; the constitution's SEO rules are applied directly. | ✅ Pass |
| II. SEO & performance | SSG service pages, unique metadata, Service/FAQPage JSON-LD, lowercase hyphenated addresses (`/services/meta-ads`), sitemap entries | ✅ Pass |
| III. Contract-first | [contracts/services-booking.openapi.yaml](./contracts/services-booking.openapi.yaml) (FAQ admin and public endpoints, webhook) | ✅ Pass |
| IV. Test-first | Webhook, lead-linking and FAQ tests first | ✅ Pass |
| V. Security & privacy | Webhook HMAC-verified; bookings are confidential lead data, readable by admins only; Cal.com is disclosed as a processor in the privacy policy | ✅ Pass |
| VI. Type safety | Typed service content modules (`satisfies ServiceContent`); webhook payload validated with Pydantic | ✅ Pass |
| VII. Accessible | Embed accessibility is verified (keyboard and screen reader); inquiry and WhatsApp fallbacks are always shown next to it | ✅ Pass. The embed's accessibility is a third-party risk, and the manual audit is in quickstart.md. |
| VIII. Simplicity | Uses a managed scheduling service rather than building availability, time zones, invitations and reminders | ✅ Pass (a managed service is preferred by the constitution; it is not a new deployable unit) |
| IX. AI | N/A | N/A |
| X. Observability | Events `service_cta_clicked`, `call_booking_opened`, `call_booked`, `call_rescheduled`, `call_cancelled` without PII | ✅ Pass |

**Post-design re-check**: Pass.

## Project Structure

### Documentation (this feature)

```text
specs/006-service-pages-booking/
├── plan.md  research.md  data-model.md  quickstart.md
└── contracts/services-booking.openapi.yaml
```

### Source Code

```text
web/
├── content/services/{social-media,seo,web-software,ui-ux-design,meta-ads}.ts   # typed copy (agency-supplied)
├── content/services/types.ts            # ServiceContent type
├── app/(site)/services/page.tsx         # overview
├── app/(site)/services/[slug]/page.tsx  # generateStaticParams (5), generateMetadata, JSON-LD
├── app/(site)/about/page.tsx            # team page (published team members)
├── components/services/{ProcessSteps,Deliverables,ServiceFaqs,RelatedCaseStudies,ServiceCta,OtherServices}.tsx
├── components/booking/BookCallEmbed.tsx # lazy Cal.com inline embed with prefill + event tracking
├── components/inquiry/InquiryForm.tsx   # success state gains "Book a discovery call" (prefilled)
├── components/nav/*                     # Services menu (desktop + mobile)
└── app/sitemap.ts                       # + /services, /services/[slug], /about

api/app/
├── models/faq.py                 # Faq (+ PublishableMixin)
├── models/discovery_call.py      # DiscoveryCall
├── routers/admin_faqs.py         # CRUD, publish, reorder (004 router factory; admin|editor)
├── routers/public_faqs.py        # GET /api/v1/public/faqs?service=&industry=&topic=
├── routers/webhooks_cal.py       # POST /api/v1/webhooks/cal
└── services/booking_service.py   # upsert booking, create/link lead, team email, upcoming-limit check
```

**Structure Decision**: This extends `web/` + `api/`. Service copy is kept in the repo (spec assumption and plan.md) as typed TS modules rather than MDX, because the content is structured (lists, steps, FAQ references), not long prose.

## Complexity Tracking

No violations.
