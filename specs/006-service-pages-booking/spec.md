# Feature Specification: Service Pages, Team Page and Discovery Call Booking

**Feature Branch**: `006-service-pages-booking`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Give each of The Buzz Crew's five services its own page so each can rank in search and convince prospects: Social Media, SEO, Web & Software, UI/UX Design, and Meta Ads. Also add a team page and the ability to book a discovery call. Each service page includes: what the service is, who it is for, deliverables, the agency's four-step process (Discovery & audit, Strategy, Execution & creative, Reporting & growth), related case studies, service-specific FAQs, and a call to action. [...] Out of scope: pricing tables, industry landing pages."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand a service from its own page (Priority: P1)

A prospect, arriving from search, an ad, the home page or the site navigation, opens the page for the service they need (for example, SEO). In a few moments they understand what the service is, whether it suits a business like theirs, exactly what they would receive, and how the agency works. They can then start an inquiry or book a call without leaving the page.

**Why this priority**: Service pages are the main search-landing pages for the agency's offerings and the core of the brief. Each page ranks and converts on its own, even before booking or the team page exist.

**Independent Test**: From the home page and from the navigation, open each of the five service pages on a phone; confirm each shows what the service is, who it is for, deliverables, the four-step process, FAQs and a call to action, and that each has its own address, title, description and structured data.

**Acceptance Scenarios**:

1. **Given** the site navigation on any page (desktop and mobile), **When** a prospect opens "Services", **Then** all five services are listed and each links to its own page, plus an overview of all services.
2. **Given** the home page, **When** a prospect views the services section, **Then** each of the five services links to its page.
3. **Given** a service page, **When** it is viewed, **Then** it shows, in order: a headline stating what the service is and the outcome it delivers, who it is for, the deliverables, the four-step process (Discovery & audit, Strategy, Execution & creative, Reporting & growth) described for that service, related case studies, service-specific FAQs, and a call to action.
4. **Given** a service page, **When** it is inspected by a search engine, **Then** it has its own readable address, a unique title and description, a canonical address, a share image, structured data describing the service (provided by the agency, areas served) and FAQ structured data matching the visible questions.
5. **Given** a service page, **When** the prospect chooses the call to action, **Then** they can start an inquiry (feature 001) with that service pre-selected, or book a discovery call, and the source service page is recorded.
6. **Given** a service page, **When** the prospect reaches the end, **Then** links to the other four services are shown.
7. **Given** a services overview page, **When** it is viewed, **Then** each service is summarised in one or two sentences with a link to its page.

---

### User Story 2 - Book a discovery call at a convenient time (Priority: P1)

A prospect who would rather talk than write chooses "Book a discovery call" from the contact page, a service page or the inquiry confirmation. They see available 30-minute slots in their own time zone, choose one, enter their name, email and what they would like to discuss, and receive a confirmation with the call details. No account is needed. They can reschedule or cancel from the confirmation email.

**Why this priority**: A call is the agency's highest-intent conversion; letting prospects book directly removes back-and-forth emails, especially across Pakistan, UAE and UK time zones.

**Independent Test**: Open the booking from the contact page, book a slot as a visitor in a UK time zone, confirm the slot is shown in UK time, the confirmation email arrives with a calendar invitation and call link, the team is notified, the slot is no longer offered to others, and rescheduling and cancelling from the email work.

**Acceptance Scenarios**:

1. **Given** the contact page, a service page or the on-screen inquiry confirmation, **When** the prospect chooses "Book a discovery call", **Then** the booking opens without leaving the site and without creating an account.
2. **Given** the booking view, **When** it opens, **Then** available 30-minute slots for the next 30 days are shown in the prospect's detected time zone, clearly labelled, with an option to change the time zone.
3. **Given** the prospect chooses a slot and enters their name, a valid email and what they would like to discuss (phone and business name optional), **When** they confirm, **Then** the slot is reserved, they see an on-screen confirmation with the date, time (in their time zone) and how the call will happen, and receive a confirmation email with a calendar invitation.
4. **Given** the booking was opened from the inquiry confirmation, **When** the booking form appears, **Then** the name, email, phone and business name they just entered are pre-filled.
5. **Given** a booked slot, **When** another prospect views availability, **Then** that slot is no longer offered, and two prospects cannot book the same slot.
6. **Given** a slot that becomes unavailable while the prospect is filling in details, **When** they confirm, **Then** they are told the slot was just taken and shown the nearest available alternatives, with their details kept.
7. **Given** a confirmed booking, **When** the agency team checks, **Then** the call appears in the team's calendar and the team receives an email with the prospect's details within 1 minute.
8. **Given** a confirmation email, **When** the prospect uses its reschedule or cancel link, **Then** they can move the call to another available slot or cancel it, without an account, and the team is notified.
9. **Given** a confirmed booking, **When** the call is 24 hours and 1 hour away, **Then** the prospect receives a reminder email.
10. **Given** no slots are available in the next 30 days, **When** the booking opens, **Then** the prospect is offered the inquiry form and WhatsApp instead.

---

### User Story 3 - See case studies relevant to the service (Priority: P2)

On a service page, the prospect sees case studies where the agency delivered that service, so they can judge its results in that area. As new case studies are published, they appear automatically.

**Why this priority**: Proof strengthens each service page, but the page is useful without it, and it depends on case studies (feature 005) being published.

**Independent Test**: Publish a case study tagged with SEO and confirm it appears on the SEO page within 5 minutes and not on unrelated service pages; unpublish it and confirm it disappears.

**Acceptance Scenarios**:

1. **Given** published case studies that delivered a service, **When** that service page is viewed, **Then** up to 3 of them are shown as cards (client, industry, headline result, cover image), in the editor-set case study order, with a link to see all case studies for that service.
2. **Given** a newly published case study for a service, **When** 5 minutes have passed, **Then** it can appear on that service page without any change to the page itself.
3. **Given** a case study is unpublished, **When** 5 minutes have passed, **Then** it no longer appears on any service page.
4. **Given** a service has no published case studies, **When** its page is viewed, **Then** the case study section is replaced by a short invitation to book a call or view all work, not an empty section.
5. **Given** the "see all" link, **When** it is followed, **Then** the Work page opens filtered to that service (feature 005).

---

### User Story 4 - Meet the team (Priority: P2)

A prospect wants to know who they would be working with and opens the team page from the navigation or footer. They see photos, names, roles and short bios of the people at the agency, in the order the agency chose.

**Why this priority**: Real people build trust for a young agency, but it is secondary to service pages and booking.

**Independent Test**: Publish two team members and leave one as a draft; open the team page and confirm only the two published members appear, in the set order, and that changes in the admin area appear within 5 minutes.

**Acceptance Scenarios**:

1. **Given** published team members (feature 004), **When** the team page is opened, **Then** each is shown with photo, name, role and bio, in the order set by editors.
2. **Given** a team member is a draft or unpublished, **When** the team page is viewed, **Then** they do not appear.
3. **Given** a change to a team member is published, **When** 5 minutes have passed, **Then** the team page reflects it without a new deployment.
4. **Given** the team page, **When** it is viewed, **Then** it includes a short introduction to the agency and a call to action to start a project or book a call.
5. **Given** no team members are published, **When** the page is viewed, **Then** it still shows the agency introduction and call to action, without an empty grid.
6. **Given** the team page, **When** it is inspected by a search engine, **Then** it has its own address, unique title and description, and share image.

---

### Edge Cases

- A prospect in a time zone that changes clocks (UK summer time) books across the changeover: the time shown in the confirmation and calendar invitation is correct for the call date.
- A prospect books several calls with the same email: each booking is allowed up to 2 upcoming calls per email address; beyond that they are asked to reschedule an existing call instead.
- Automated or abusive booking attempts: the same bot protection and per-visitor limits as the inquiry form (feature 001) apply.
- The confirmation email fails to send: the booking still stands, the prospect still sees the on-screen confirmation with the details, and the failure is recorded.
- The team's calendar changes (a team member blocks time) after slots were shown: the slot is re-checked at confirmation and the prospect is offered alternatives if it is no longer free.
- A prospect uses the reschedule link after the call time has passed: they are told the call has passed and offered a new booking.
- A cancelled slot becomes available to others again.
- A service page is opened with an old or misspelled address: it redirects to the right page or shows "not found" with links to all services.
- The booking view is used with a keyboard or screen reader: dates and times are announced clearly with their time zone.
- A prospect's detected time zone is wrong (for example, using a VPN): they can change it, and times update immediately.

## Requirements *(mandatory)*

### Functional Requirements

**Service pages**

- **FR-001**: The site MUST have one page for each service: Social Media, SEO, Web & Software, UI/UX Design and Meta Ads, each at its own readable, permanent address within a Services section, plus a services overview page.
- **FR-002**: Each service page MUST include: what the service is and the outcome it delivers; who it is for (types of business and situations); a list of deliverables; the four-step process (Discovery & audit, Strategy, Execution & creative, Reporting & growth) with a short description of what each step means for that service; related case studies; at least 4 service-specific FAQs; and a call to action.
- **FR-003**: Each service page MUST have a unique title and description, canonical address, share image, structured data describing the service (service type, provider, areas served: Pakistan, UAE, UK) and FAQ structured data that matches the visible FAQs (per feature 002).
- **FR-004**: The site navigation (desktop and mobile) and the home page MUST link to all five service pages; each service page MUST link to the other four.
- **FR-005**: Each service page MUST offer "Start a project" (opening the inquiry form with that service pre-selected) and "Book a discovery call", and record the service page as the source.
- **FR-006**: Service pages MUST NOT show pricing tables.
- **FR-007**: Service FAQs MUST be manageable in the admin area's existing FAQ content, with each FAQ assignable to one or more services; only published FAQs appear.

**Related case studies**

- **FR-008**: Each service page MUST show up to 3 published case studies that delivered that service, in the editor-set case study order, updating automatically within 5 minutes of publishing or unpublishing, with a link to the Work page filtered by that service (feature 005).
- **FR-009**: When a service has no published case studies, the section MUST be replaced by an invitation to book a call or view all work.

**Team page**

- **FR-010**: The site MUST have a team page, reachable from the navigation ("About") and the footer, showing only published team members (feature 004) with photo, name, role and bio, in the editor-set order, plus a short agency introduction and a call to action.
- **FR-011**: Team page changes MUST appear within 5 minutes of publishing, without a deployment.

**Discovery call booking**

- **FR-012**: Prospects MUST be able to book a 30-minute discovery call from the contact page, every service page and the inquiry confirmation, without creating an account.
- **FR-013**: The booking view MUST show only genuinely available slots, based on the agency's working hours (Monday–Friday, 10:00–18:00 Pakistan time) and the team's real calendar availability, from at least 12 hours ahead up to 30 days ahead.
- **FR-014**: Times MUST be shown in the prospect's detected time zone, clearly labelled, with the option to change time zone; all emails and calendar invitations MUST show the correct time for the prospect.
- **FR-015**: The booking form MUST collect name (required), email (required, valid), phone (optional), business name (optional), country (required) and what they would like to discuss (required, at least 10 characters), and MUST pre-fill any details already entered in the inquiry form.
- **FR-016**: The system MUST prevent double-booking: a slot can be booked by only one prospect, and availability MUST be re-checked at confirmation.
- **FR-017**: On booking, the prospect MUST see an on-screen confirmation and receive a confirmation email with the date, time, time zone, how the call will take place (video-call link) and links to reschedule or cancel; the email MUST include a calendar invitation.
- **FR-018**: The agency team MUST receive the booking details by email within 1 minute, and the call MUST appear in the team's calendar.
- **FR-019**: Prospects MUST be able to reschedule or cancel from the link in their email without an account; the team MUST be notified, and freed slots become available again.
- **FR-020**: Prospects MUST receive reminder emails 24 hours and 1 hour before the call.
- **FR-021**: Each booking MUST be stored with the prospect's details, the source page, the call time and its status (Booked, Rescheduled, Cancelled); a booking MUST create a lead with status "New" and source "Discovery call", or be linked to the lead from the inquiry just submitted by the same prospect.
- **FR-022**: Booking MUST use the same bot protection and per-visitor submission limits as the inquiry form (feature 001), and limit each email address to 2 upcoming calls.
- **FR-023**: If email sending fails, the booking MUST still stand and the failure MUST be recorded (as for inquiries in feature 001).
- **FR-024**: The booking view MUST be fully usable on a phone and with a keyboard and screen reader, with dates and times announced including their time zone.

**Privacy and measurement**

- **FR-025**: Booking data MUST be treated as confidential lead data (admin-only access per feature 003) and covered by the privacy policy (feature 002).
- **FR-026**: The system MUST record events for service page views, "Start a project" and "Book a discovery call" clicks, completed bookings, reschedules and cancellations, with the source page and without personal data.

### Key Entities

- **Service**: One of the five fixed services. Name, readable address, summary, description, audience, deliverables, process step descriptions, and links to its FAQs and case studies.
- **Service FAQ**: An existing FAQ item (managed in the admin area) assigned to one or more services.
- **Team member** (from feature 004): Shown on the team page when published.
- **Discovery call booking**: A prospect's reserved call. Prospect details, what they want to discuss, call start time and time zone, source page, status (Booked, Rescheduled, Cancelled), linked lead, and reschedule/cancel link. Confidential.
- **Availability**: The time slots the agency offers, derived from working hours and the team's calendar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A prospect can reach any service page from the home page or navigation in no more than 2 interactions.
- **SC-002**: 100% of service pages, the services overview and the team page have unique titles, descriptions, share images and valid structured data with 0 errors in rich-results validation.
- **SC-003**: Service pages score 90 or above for SEO and Accessibility in a mobile Lighthouse audit and meet the site's mobile performance targets (feature 002).
- **SC-004**: A prospect can book a discovery call in under 2 minutes on a phone, without creating an account.
- **SC-005**: 0 double-booked slots and 0 bookings shown at the wrong time for the prospect's time zone.
- **SC-006**: Newly published or unpublished case studies and team members are reflected on service and team pages within 5 minutes in 100% of cases.
- **SC-007**: 0 draft team members appear on the team page.
- **SC-008**: Within 3 months of launch, each service page appears in search results for its main service-and-location search phrases (for example, "SEO agency Karachi"), as reported by the search engine's site console.
- **SC-009**: Within 3 months of launch, discovery call bookings account for at least 20% of new leads.

## Assumptions

- **Depends on** features 001 (inquiry form, bot protection and limits), 002 (SEO, share images, structured data, analytics, privacy policy), 003 (admin access), 004 (team members, publishing) and 005 (case studies and the Work page filter by service).
- **Service page copy** (what it is, who it is for, deliverables, process descriptions) is written by the agency and maintained as site content by the developer in this feature; editing it in the admin area can be a later feature. FAQs are the exception and are managed in the admin area.
- **Team page** is the "About" page already in the site navigation.
- **Call format**: Discovery calls are 30-minute video calls with a link in the invitation; the prospect can mention in their notes if they prefer a WhatsApp or phone call.
- **Working hours** for bookable slots are Monday–Friday, 10:00–18:00 Pakistan time (covering UAE mornings–afternoons and UK mornings), from 12 hours to 30 days ahead. The agency can adjust these.
- **Availability** comes from the team's existing calendar, so blocking time in the calendar removes it from the booking view; no separate availability screen is built in the admin area.
- **Viewing bookings** in the admin area comes with the lead-management feature; until then, the team sees bookings through notification emails and their calendar.
- **Language**: English only.
- **Out of scope**: Pricing tables, industry landing pages, paid consultations or deposits, choosing a specific team member to book with, group calls, and admin editing of service page copy.
