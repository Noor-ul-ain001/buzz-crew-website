# Quickstart: Service Pages, Team Page and Discovery Call Booking

## Prerequisites

- Features 001, 003, 004 and 005 are running.
- A Cal.com account with the "Discovery call" event type configured as in research R1 (30 minutes; Monday–Friday 10:00–18:00 Asia/Karachi; 12-hour minimum notice; 30-day window; required questions; 24 h and 1 h reminder workflows; booker upcoming-booking limit of 2), with the team calendar connected.
- A Cal.com webhook pointing at `https://<api>/api/v1/webhooks/cal` (locally via a tunnel such as `cloudflared`) with the three booking triggers.

```text
# web/.env.local
NEXT_PUBLIC_CAL_LINK=thebuzzcrew/discovery-call
# api/.env
CAL_WEBHOOK_SECRET=<from Cal.com>
CAL_API_KEY=<for cancelling over-limit bookings>
```

## Test

```bash
cd api && uv run pytest tests/test_cal_webhook.py tests/test_faqs.py
cd web && npx vitest run content/services && npx playwright test e2e/services.spec.ts e2e/about.spec.ts
npx lhci autorun --collect.url=http://localhost:3000/services/seo
```

## Validation scenarios

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Open Services in the desktop and mobile nav (US1) | All five services plus the overview; each page within 2 interactions from home |
| 2 | Open each `/services/{slug}` | Sections in the specified order; unique title and description; valid Service + FAQPage + Breadcrumb JSON-LD (Rich Results Test: 0 errors); ≥ 4 FAQs |
| 3 | "Start a project" on `/services/meta-ads` | Inquiry form with Meta Ads pre-selected; `source_page=/services/meta-ads` |
| 4 | Publish a case study with SEO (US3) | Appears on `/services/seo` on the next request, not on `/services/ui-ux-design`; unpublish → gone |
| 5 | A service with no case studies | Invitation block instead of an empty section |
| 6 | Book from `/contact` with the browser time zone set to Europe/London (US2) | Slots shown in UK time; after booking: on-screen confirmation, Cal.com email with .ics and reschedule/cancel links, team email within 1 minute, `discovery_calls` row + lead `source=discovery_call` |
| 7 | Submit an inquiry, then "Book a discovery call" from the confirmation | Embed pre-filled with name and email; the booking links to the same lead (no duplicate) |
| 8 | Book the same slot in two browsers | The second is refused by Cal.com and offered alternatives |
| 9 | Reschedule, then cancel from the email link | Row status updates; team notified; the slot is available again |
| 10 | A third upcoming booking with the same email | Cancelled automatically with a courtesy message; team flagged |
| 11 | Webhook with a bad signature | 401; nothing stored |
| 12 | `/about` with 2 published team members + 1 draft (US4) | Only the 2 published, in editor order; a change appears within 5 minutes |
| 13 | Keyboard and screen-reader pass over the booking embed | Dates and times announced with their time zone. **If the embed fails, record the gap and rely on the adjacent inquiry and WhatsApp alternatives until fixed** |

Contracts: [contracts/services-booking.openapi.yaml](./contracts/services-booking.openapi.yaml). Data model: [data-model.md](./data-model.md).
