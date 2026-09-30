# Research: Service Pages, Team Page and Discovery Call Booking

> **Hosting update (2026-09-28):** the project runs entirely on Vercel Hobby. The decisions in [DEPLOYMENT.md](../DEPLOYMENT.md) take precedence over this file where they conflict. They are D1–D2 (hosting and routing) and D4 (team emails for bookings are sent inline in the webhook handler).

## R1. Scheduling: build or use a service

- **Decision**: Use Cal.com (hosted), with a "Discovery call" event type:
  - 30 minutes, with Cal Video or Google Meet as the location;
  - availability Monday–Friday 10:00–18:00 Asia/Karachi;
  - a minimum notice of 12 hours and a 30-day booking window;
  - the team's Google Calendar connected for conflict checking.

  Required booking questions are name, email, country (a select) and "What would you like to discuss?" (at least 10 characters). Phone and business name are optional.
- **Rationale**: Cal.com meets FR-013–FR-020 out of the box:
  - real availability and double-booking prevention;
  - visitor time-zone detection with a manual switch, and daylight-saving-correct invitations;
  - confirmation emails with an .ics file and reschedule/cancel links, which need no account;
  - reminder workflows at 24 hours and 1 hour.

  Building these ourselves would take weeks and has known correctness pitfalls, especially time zones and DST. The constitution prefers managed services.
- **Alternatives considered**: Calendly was rejected because webhooks and some prefill features need paid plans and the embed is less configurable. A custom scheduler on FastAPI with the Google Calendar API was rejected under Principle VIII.

## R2. Embedding and prefill

- **Decision**: `@calcom/embed-react` inline embed, loaded with `next/dynamic` when the booking section enters the viewport (IntersectionObserver) or the "Book a discovery call" button is clicked. The embed config sets `name`, `email`, `notes` (from the inquiry message, if coming from the inquiry confirmation) and metadata `source_page` and `inquiry_id` (the lead id from 001's response). The embed's `bookingSuccessful` event fires `track("call_booked", { source_page })`. Inquiry and WhatsApp alternatives are always rendered beside it.
- **Rationale**: This meets FR-012, FR-015 (prefill from the inquiry) and the performance goal.

## R3. Storing bookings and linking leads

- **Decision**: A Cal.com webhook subscribed to `BOOKING_CREATED`, `BOOKING_RESCHEDULED` and `BOOKING_CANCELLED` posts to `POST /api/v1/webhooks/cal`. The API verifies `X-Cal-Signature-256` (HMAC-SHA256 with `CAL_WEBHOOK_SECRET`) and handles events idempotently by the Cal booking `uid`:
  - **Created**:
    - If `metadata.inquiry_id` refers to an existing lead, or a lead with the same email exists from the last 24 hours, the booking is linked to it.
    - Otherwise a lead is created (`status=new`, `source=discovery_call`, `services=[]`, `budget_range=not_sure`, message = the discussion notes, country from the answer).
    - A `discovery_calls` row is stored, and the team is sent an email with the details (FR-018).
  - **Rescheduled/cancelled**: the row's time and status are updated, and the team is notified.
- **Rationale**: This meets FR-021 and FR-023. Emails to the prospect come from Cal.com; our email failures are recorded as in feature 001.

## R4. Bot protection and the 2-upcoming-calls limit

- **Decision**: Rely on Cal.com's own booking-page spam protection rather than Turnstile inside the third-party iframe. Enforce "maximum 2 upcoming calls per email" with Cal.com's per-booker limit on upcoming bookings for the event type. The webhook double-checks: a third upcoming booking for the same email is cancelled through the Cal.com API, with a courtesy message suggesting they reschedule instead, and is flagged to the team.
- **Rationale**: Turnstile cannot be placed inside the Cal.com iframe. The webhook check guarantees FR-022's limit even if the provider setting changes. **Verification task**: confirm the booker-limit setting on the chosen Cal.com plan during implementation. The webhook check alone is sufficient if it is unavailable.
- **Alternatives considered**: Putting a Turnstile gate before showing the embed was rejected because it adds friction for all genuine bookers for little gain.

## R5. Service copy storage

- **Decision**: `web/content/services/{slug}.ts` exports `ServiceContent`, which contains:
  - `slug`, `name`, `headline` and `summary`;
  - `outcome`, `audience[]` and `deliverables[]`;
  - `process` (4 entries keyed discovery, strategy, execution and reporting, each with a description);
  - `seo` (title and description), `ogImageAlt` and `relatedServices[]`.

  Slugs are `social-media`, `seo`, `web-software`, `ui-ux-design` and `meta-ads`. A build-time test asserts 5 files, unique titles and descriptions, and descriptions of 70–160 characters.
- **Rationale**: This follows the spec assumption and plan.md. Typed modules catch missing fields at build time.

## R6. Service FAQs, and the FAQ table's home

- **Decision**: This feature creates the `faqs` table (PublishableMixin, `question`, `answer_md`, `topic`, `services[]`, `industries[]`), admin CRUD (admin or editor, via the existing `/admin/content/faqs` prototype) and `GET /api/v1/public/faqs?service=`. Service pages show published FAQs for that service, and the page build fails if fewer than 4 exist (FR-002). The spec's "at least 4" is enforced as a content check at release, not at runtime. Feature 007 adds the public `/faq` page and extra topics on the same table, without a schema change.
- **Rationale**: FR-007 needs FAQ management now, and 007's spec describes the same entity, so defining it once here avoids a later migration.

## R7. Related case studies on service pages

- **Decision**: Fetch `GET /api/v1/public/case-studies?service={enum}&page_size=3` with tags `["case-studies"]` and `revalidate: 300`. When the list is empty, the section is replaced by a "Book a call / View all work" invitation. "See all" links to `/work?service={slug}`.
- **Rationale**: This meets FR-008 and FR-009. Revalidation already fires on case-study changes (feature 005).

## R8. Structured data

- **Decision**: Per service: a `Service` object (`serviceType`, `provider` → Organization `@id`, `areaServed` = Pakistan, United Arab Emirates, United Kingdom) plus `FAQPage` (published FAQs exactly as shown) plus `BreadcrumbList`. `/about`: `AboutPage` plus `Person` entries for team members, with name and jobTitle only.
- **Rationale**: This meets FR-003 and the constitution's structured-data rule.

## R9. Team page location

- **Decision**: `/about`, matching the existing "About" navigation item. It shows the agency introduction and call to action, and the team grid, which is hidden when empty. Data comes from the feature 004 public team endpoint, tag `team-members`.
- **Rationale**: This meets FR-010 and FR-011.

## R10. Privacy

- **Decision**: The privacy policy (feature 002 content) lists Cal.com as a processor for bookings. Bookings in our database are admin-only (feature 003 permission matrix: `discovery_calls` with the leads). Analytics events carry `source_page` only.
- **Rationale**: This meets FR-025 and FR-026.
