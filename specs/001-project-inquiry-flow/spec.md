# Feature Specification: Project Inquiry Flow

**Feature Branch**: `001-project-inquiry-flow`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Build a project inquiry flow for The Buzz Crew, a digital marketing agency serving clients in Pakistan, the UAE and the UK. Today every "Start a project" and "Contact" button opens an email client, so the agency cannot capture, track or follow up on leads. Visitors can open an inquiry form from any call-to-action button and from a dedicated contact page. The form collects: name, email, phone (optional), business name (optional), country (Pakistan, UAE, UK, Other), services needed (multi-select: Social Media, SEO, Web & Software, UI/UX Design, Meta Ads), monthly budget range, and a project message. [...] Out of scope: viewing or managing leads (a later feature), call booking, payments."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit a project inquiry and see confirmation (Priority: P1)

A prospective client, usually on a phone after arriving from social media or an ad, taps "Start a project" (or visits the contact page), fills in a short form and submits it. They immediately see a confirmation on screen that the team has received the request and will respond within 24 hours. The agency now has the inquiry stored as a lead instead of relying on an email the visitor may never send.

**Why this priority**: This is the core of the feature. Without a stored lead, nothing else (emails, tracking, follow-up) has value. On its own it already replaces the lost `mailto:` inquiries.

**Independent Test**: Open the form from a "Start a project" button on a phone-sized screen, submit valid details and confirm that a confirmation appears and a lead exists with status "New" and a submission timestamp.

**Acceptance Scenarios**:

1. **Given** a visitor on any page with a "Start a project" or "Contact" call to action, **When** they activate it, **Then** the inquiry form opens without leaving the site and without opening an email client.
2. **Given** a visitor on the contact page, **When** the page loads, **Then** the inquiry form is shown on the page.
3. **Given** a visitor has filled in all required fields with valid values, **When** they submit, **Then** a lead is stored with status "New" and the submission timestamp, and the visitor sees a confirmation stating the team will respond within 24 hours.
4. **Given** a visitor leaves the name empty, enters an invalid email, or writes a message shorter than 10 characters, **When** they submit, **Then** each problem is shown next to the relevant field, focus moves to the first field in error, entered values are kept, and no lead is stored.
5. **Given** a visitor has submitted successfully, **When** the confirmation is shown, **Then** it is announced to screen-reader users and offers a way to close the form or return to browsing.
6. **Given** the submission cannot be completed because of a temporary problem, **When** the visitor submits, **Then** they see a clear error with an option to retry and an alternative (WhatsApp or email), and the values they entered are kept.

---

### User Story 2 - Agency team is notified of every new lead (Priority: P1)

As soon as a lead is stored, the agency team receives an email containing every detail the visitor entered, so someone can respond quickly while the prospect is still interested.

**Why this priority**: The agency has no lead-management screen yet (a later feature), so the notification email is how the team actually learns about and acts on new leads.

**Independent Test**: Submit a valid inquiry and confirm the team inbox receives one email within one minute containing all submitted fields, the submission time and the page it came from.

**Acceptance Scenarios**:

1. **Given** a valid inquiry has been stored, **When** processing completes, **Then** the team's notification address receives an email within one minute containing name, email, phone, business name, country, services, budget, message, submission time and the page the inquiry was sent from.
2. **Given** the team email is received, **When** a team member uses "reply", **Then** the reply is addressed to the prospective client's email.
3. **Given** the notification email cannot be sent, **When** the submission is processed, **Then** the lead is still stored, the visitor still sees the normal confirmation, and the failure is recorded against the lead.

---

### User Story 3 - Prospective client receives a confirmation email (Priority: P2)

After submitting, the prospective client receives an email that thanks them, restates what they asked for (services, budget, country and message) and states that the team will respond within 24 hours, with WhatsApp offered as a faster alternative.

**Why this priority**: It reassures the prospect and gives them a record of their request, but the lead is captured and actionable without it.

**Independent Test**: Submit a valid inquiry with a reachable email address and confirm a confirmation email arrives that restates the submitted request and the expected response time.

**Acceptance Scenarios**:

1. **Given** a valid inquiry has been stored, **When** processing completes, **Then** the email address entered receives a confirmation email restating the selected services, budget range, country and message, and stating that the team will respond within 24 hours.
2. **Given** the confirmation email cannot be sent (for example, the address rejects mail), **When** the submission is processed, **Then** the lead is still stored, the on-screen confirmation is unchanged, and the failure is recorded against the lead.

---

### User Story 4 - Contact the agency on WhatsApp (Priority: P2)

A prospective client who prefers messaging taps a WhatsApp button, available on every public page, which opens a chat with the agency with a pre-filled greeting they can send or edit.

**Why this priority**: Many prospects in Pakistan and the UAE prefer WhatsApp to forms. It is a lower-effort channel that captures people who would otherwise leave.

**Independent Test**: On any public page, tap the WhatsApp button and confirm a chat with the agency's number opens with the pre-filled message, and that a click event is recorded.

**Acceptance Scenarios**:

1. **Given** a visitor on any public page, **When** they activate the WhatsApp button, **Then** a WhatsApp chat with the agency's business number opens (app on mobile, WhatsApp Web or app on desktop) with a pre-filled greeting, in a new tab so the site stays open.
2. **Given** a visitor activates the WhatsApp button, **When** the chat opens, **Then** a WhatsApp click event is recorded with the page it was clicked from.
3. **Given** a keyboard or screen-reader user, **When** they reach the WhatsApp button, **Then** it is focusable, has a visible focus state and is announced as opening a WhatsApp chat in a new tab.

---

### User Story 5 - Spam and abuse are blocked (Priority: P2)

Automated bots and repeated abusive submissions are rejected before they become leads, so the leads list stays clean and the team inbox is not flooded.

**Why this priority**: Public forms attract spam within days of launch. Without protection, real leads get buried and the team loses trust in the notifications.

**Independent Test**: Submit an inquiry that fails the bot check and confirm it is rejected with a clear message and nothing is stored; submit more than the allowed number of inquiries from one visitor and confirm the excess is rejected with a "try again later" message.

**Acceptance Scenarios**:

1. **Given** a submission fails the bot check, **When** it is received, **Then** it is rejected, no lead is stored, no emails are sent, and the visitor sees a clear message explaining that the submission could not be verified, with an option to try again or use WhatsApp.
2. **Given** a visitor has already submitted 5 inquiries in the last hour, **When** they submit again, **Then** the submission is rejected, nothing is stored, and they see a "Too many attempts, please try again later" message that also offers WhatsApp.
3. **Given** a genuine visitor using a keyboard or screen reader, **When** they complete the form, **Then** the bot check does not require a visual puzzle they cannot solve.

---

### Edge Cases

- A visitor double-taps "Send" or submits the same inquiry twice within a few seconds: only one lead is created and only one pair of emails is sent.
- A visitor loses connection or the request times out during submission: they see an error with a retry option and their entered values are kept.
- A visitor closes the form part-way through and reopens it on the same page: previously entered values are kept for that page visit.
- Values with leading or trailing spaces: they are trimmed before validation, so a name of only spaces counts as missing.
- A very long message or pasted text: the message is limited to 2,000 characters, with a visible character count as the limit approaches.
- A phone number in local or international format (for example `0300 1234567`, `+971 50 123 4567`, `+44 7700 900123`): accepted if it looks like a phone number; clearly invalid input (letters, too short) shows an inline error.
- Message text containing links or markup: it is stored and shown in emails as plain text, never as active content.
- Submissions from visitors with scripting disabled or a broken form overlay: the contact page and the email address remain available as a fallback.
- Both emails fail at once: the lead is still stored, both failures are recorded, and the visitor still sees success (the lead exists and the team will act on it once they check).
- The WhatsApp app is not installed on the device: the chat opens in WhatsApp Web or the WhatsApp download page, which is the standard WhatsApp behaviour.

## Requirements *(mandatory)*

### Functional Requirements

**Access to the form**

- **FR-001**: Every "Start a project" and "Contact" call to action on the public site MUST open the inquiry form on the current page instead of opening an email client.
- **FR-002**: The site MUST have a dedicated contact page that shows the inquiry form inline.
- **FR-003**: The inquiry form MUST record which page it was submitted from, so the team knows where the lead originated.

**Form fields and validation**

- **FR-004**: The form MUST collect: name (required), email (required), phone (optional), business name (optional), country (required; Pakistan, UAE, UK, Other), services needed (required; one or more of Social Media, SEO, Web & Software, UI/UX Design, Meta Ads), monthly budget range (required, including a "Not sure yet" option) and project message (required).
- **FR-005**: The system MUST reject a submission, and store nothing, when the name is missing, the email is not a valid email address, the message is shorter than 10 characters (after trimming spaces), a required choice is not made, or a phone number, if provided, is not a plausible phone number.
- **FR-006**: The system MUST enforce maximum lengths: name 100 characters, business name 150 characters, email 254 characters, message 2,000 characters.
- **FR-007**: Validation errors MUST appear inline next to the affected field, in plain language, both when the visitor leaves a field and when they submit; the same rules MUST be enforced again when the submission is received, so bypassing the form does not bypass validation.
- **FR-008**: The form MUST keep all entered values when validation fails or submission errors occur.
- **FR-009**: The form MUST show a clear in-progress state while submitting and prevent the same inquiry being submitted twice.

**Storing leads**

- **FR-010**: Each valid submission MUST be stored as exactly one lead with status "New", the submission timestamp, all submitted fields and the originating page.
- **FR-011**: After a lead is stored, the visitor MUST see an on-screen confirmation that states the team will respond within 24 hours and offers WhatsApp as an alternative.

**Emails**

- **FR-012**: The system MUST send the agency team a notification email with all lead details within one minute of the lead being stored, with replies addressed to the prospective client.
- **FR-013**: The system MUST send the prospective client a confirmation email that restates their selected services, budget range, country and message and states the 24-hour response time.
- **FR-014**: Failure to send either email MUST NOT prevent the lead from being stored or change the visitor's on-screen confirmation.
- **FR-015**: The system MUST record, for each lead, whether each email was sent successfully or failed, and when, so failed sends can be followed up.
- **FR-016**: Visitor-entered text MUST appear in emails as plain text; links or markup in it MUST NOT become active content.

**WhatsApp**

- **FR-017**: Every public page MUST show a WhatsApp button that opens a chat with the agency's WhatsApp Business number with a pre-filled greeting, in a new tab.
- **FR-018**: The inquiry form's confirmation and error states MUST offer WhatsApp as an alternative contact route.

**Spam and abuse protection**

- **FR-019**: Every submission MUST pass an automated bot check before a lead is stored; submissions that fail MUST be rejected with a clear message, and no lead or emails may result from them.
- **FR-020**: The bot check MUST NOT require visual puzzles for typical visitors and MUST remain passable for keyboard and screen-reader users.
- **FR-021**: The system MUST limit submissions to 5 per visitor per hour; submissions beyond the limit MUST be rejected with a "try again later" message and nothing stored.

**Accessibility and mobile use**

- **FR-022**: The form, its open/close behaviour, error messages, confirmation and the WhatsApp button MUST be fully operable with a keyboard alone and understandable with a screen reader: every field has a visible label, required fields are identified, errors are announced and linked to their fields, focus moves into the form when it opens, stays within it while it is open, returns to the triggering button when it closes, and the form can be closed with the Escape key.
- **FR-023**: The form MUST be usable on a 360-pixel-wide phone screen without horizontal scrolling, with touch targets large enough to tap reliably and with the appropriate on-screen keyboard for email and phone fields.

**Events and privacy**

- **FR-024**: The system MUST record an event for each successful inquiry submission and each WhatsApp button click, including the page it happened on and the time.
- **FR-025**: Recorded events MUST NOT contain personal details (name, email, phone, business name or message).
- **FR-026**: The form MUST link to the privacy policy and state briefly that the details are used only to respond to the inquiry.

### Key Entities

- **Lead**: One prospective client's inquiry. Holds name, email, optional phone, optional business name, country, one or more services, budget range, message, originating page, status (starts as "New"; other statuses belong to the later lead-management feature) and the time it was submitted.
- **Email delivery record**: The outcome of each email sent for a lead (team notification, client confirmation): whether it succeeded or failed, when, and a short reason on failure. Belongs to exactly one lead.
- **Engagement event**: A recorded occurrence of a successful inquiry submission or a WhatsApp click, with the event type, originating page and time. Contains no personal details.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor on a phone can open the form and submit a valid inquiry in under 2 minutes.
- **SC-002**: 100% of valid submissions result in a stored lead with status "New" and a timestamp, including when email sending fails.
- **SC-003**: At least 95% of team notification emails arrive within 1 minute of submission.
- **SC-004**: 0 leads are stored from submissions that fail validation, fail the bot check or exceed the submission limit.
- **SC-005**: No "Start a project" or "Contact" call to action on the public site opens an email client.
- **SC-006**: A keyboard-only user and a screen-reader user can each complete and submit the form, and hear or see the confirmation, without help.
- **SC-007**: After launch, fewer than 5% of stored leads are identified by the team as spam.
- **SC-008**: Every successful submission and WhatsApp click appears as an event, so the agency can count inquiries and WhatsApp contacts per page each week.

## Assumptions

- **Response time**: The promised response time is "within 24 hours", matching the existing contact page copy. (The FAQ says "within one working day"; the copy should be made consistent.)
- **Budget ranges**: The existing ranges are used: Under PKR 50k, PKR 50k–150k, PKR 150k+ and Not sure yet. Showing ranges in AED or GBP for UAE and UK visitors is not part of this feature and can be revisited during `/speckit-clarify` if needed.
- **Required fields**: Beyond name, email and message, country, at least one service and a budget choice are required, because the team needs them to qualify a lead. "Not sure yet" keeps the budget question low-friction.
- **Submission limit**: "Reasonable limit" is interpreted as 5 submissions per visitor per hour.
- **Recipients**: Team notifications go to a single configurable agency address (currently the agency's contact email). Distribution to multiple team members is handled by that inbox.
- **Email failures**: Failures are recorded, not automatically retried beyond what the email service does itself; resending or reviewing failed emails will be handled by the later lead-management feature.
- **WhatsApp number**: The agency will supply its real WhatsApp Business number before launch (a placeholder is currently configured). The pre-filled greeting is the existing site message.
- **Events and consent**: Submission and WhatsApp events are recorded first-party without personal data. Any third-party tracking pixels follow the site's existing consent rules and are not required for this feature.
- **Language**: The form and emails are in English only.
- **Existing work**: A front-end form prototype already exists in the site; this feature defines the complete behaviour (storage, emails, protection and events) that it must meet.
- **Out of scope**: Viewing, filtering or changing the status of leads; call booking; payments; file attachments; multi-step or multilingual forms; CRM integration.
