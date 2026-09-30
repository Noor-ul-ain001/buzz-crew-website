# Feature Specification: Client Portal and Multilingual Public Site

**Feature Branch**: `011-client-portal`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Give The Buzz Crew's existing clients a private portal to follow their projects, review work and see reports, reducing back-and-forth over WhatsApp and email and making the agency's 'measurable growth' promise visible. [...] 8. As a visitor or client, I can switch the public website between English, Urdu and Arabic, with Arabic shown right to left. [...] Out of scope: online payments, in-portal chat, a mobile app."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clients get secure access to their organisation (Priority: P1)

An admin invites a client contact by email and links them to their organisation (for example, "Nuaimi Properties"). The client receives an email, sets a password and signs in to a portal that shows only their organisation's work. When the relationship ends, or a contact leaves the client's company, the admin deactivates their access and it stops immediately.

**Why this priority**: Nothing else in the portal is safe without strict, organisation-level access. This story alone delivers a working, secure portal shell.

**Independent Test**: Invite two contacts from two different organisations; accept both invitations; confirm each sees only their own organisation; try opening the other organisation's addresses directly and confirm nothing is shown; deactivate one contact and confirm their next action is refused.

**Acceptance Scenarios**:

1. **Given** a signed-in admin, **When** they create an organisation (name, country, primary contact) and invite a contact by email, **Then** the contact receives an email with a single-use link valid for 72 hours to set a password.
2. **Given** an invited contact, **When** they open the link in time and set a password meeting the password rules (feature 003), **Then** their portal account becomes active and they are signed in to their organisation's portal.
3. **Given** a signed-in client, **When** they use the portal, **Then** they see only their own organisation's projects, reports, approval items and invoices.
4. **Given** a signed-in client, **When** they open or request any address belonging to another organisation (for example, by changing a number in the link), **Then** they see "not found", with no hint that the item exists, and the attempt is recorded as a security event.
5. **Given** a signed-in client, **When** they try to open any team admin page, **Then** they are refused.
6. **Given** an admin deactivates a client contact or a whole organisation, **When** the deactivated person takes their next action, **Then** their session has ended, they cannot sign in again, and no portal data is shown.
7. **Given** a client who forgot their password, **When** they use "Forgot password", **Then** the reset works as for team members (feature 003), without revealing whether the account exists.
8. **Given** repeated failed sign-ins, **When** limits are exceeded, **Then** the account is temporarily blocked as for team members (feature 003).
9. **Given** the portal, **When** it is requested by search engines, **Then** no portal page is indexed.

---

### User Story 2 - Clients follow their projects (Priority: P1)

A client signs in and sees each of their organisation's projects with the services involved and its current stage in the agency's process: Discovery & audit, Strategy, Execution & creative, Reporting & growth. They can see when each stage started and any short update the team added.

**Why this priority**: "Where are we?" is the most common question clients send on WhatsApp. Answering it in the portal is the core time-saver.

**Independent Test**: Create two projects for an organisation, move one to "Strategy" with an update note; confirm the client sees both projects, the correct stages, the stage dates and the note.

**Acceptance Scenarios**:

1. **Given** a signed-in client, **When** they open the portal home, **Then** they see their organisation's active projects, each with name, services, current stage, and counts of items awaiting their approval and reports posted.
2. **Given** a project, **When** the client opens it, **Then** they see a four-step stage tracker showing completed, current and upcoming stages, the date each stage started, and the team's update notes, newest first.
3. **Given** an admin moves a project to a new stage and adds a note, **When** the client next views the project, **Then** the new stage, date and note are shown.
4. **Given** a completed project, **When** the client views the portal, **Then** it appears under "Completed projects" with its reports still available.
5. **Given** the stage tracker, **When** it is used with a screen reader, **Then** each stage's status (completed, current, upcoming) is announced in text, not only by colour.

---

### User Story 3 - Clients review and approve work (Priority: P1)

The team submits a social media post (images and caption) or a design for the client's review. The client is emailed, opens the item in the portal, and either approves it or requests changes with a comment. The team sees the decision and the full history, including earlier versions.

**Why this priority**: Approvals over WhatsApp get lost and are hard to prove later. A recorded decision per version protects both sides.

**Independent Test**: Submit an item, request changes as the client with a comment, submit a revised version, approve it; confirm each decision records who made it and when, the team was notified, and the history shows both versions and decisions.

**Acceptance Scenarios**:

1. **Given** a signed-in admin, **When** they submit an item for approval on a project (title, type: social post or design, one or more images or a PDF, optional caption, optional due date), **Then** it appears in the client's portal as "Awaiting your review" and all active members of the organisation are emailed.
2. **Given** a client viewing an item, **When** they choose "Approve", **Then** the item version becomes "Approved", recording the client's name and the date and time, and the team is emailed.
3. **Given** a client viewing an item, **When** they choose "Request changes", **Then** they must enter a comment (at least 5 characters) before submitting, and the item version becomes "Changes requested", recording who and when; the team is emailed with the comment.
4. **Given** an item with changes requested, **When** the team uploads a revised version, **Then** it becomes a new version "Awaiting your review", and earlier versions, decisions and comments stay visible in the history.
5. **Given** a version that has been decided, **When** anyone views it, **Then** its decision cannot be changed or deleted; a further change requires a new version.
6. **Given** an item, **When** a client or team member adds a comment without deciding, **Then** the comment is shown in the history with author and time.
7. **Given** the item's images, **When** they are viewed, **Then** they can be enlarged, and the caption is shown as it would be posted.
8. **Given** an item with a due date that has passed without a decision, **When** the client views the portal, **Then** it is highlighted as overdue for review.

---

### User Story 4 - Clients see monthly reports (Priority: P2)

Each month the team posts a report for the client's project. The client is emailed, signs in, sees the key results at a glance and downloads the full report.

**Why this priority**: Makes the "measurable growth" promise visible and replaces emailed attachments, but projects and approvals deliver day-to-day value first.

**Independent Test**: Upload a monthly report with headline figures; confirm members of the organisation are emailed with a portal link (no attachment), see the headline figures, and can download the file; confirm a signed-out person and a member of another organisation cannot download it even with the direct link.

**Acceptance Scenarios**:

1. **Given** a signed-in admin, **When** they upload a report for a project (period month and year, title, PDF file up to 20 MB, optional summary, and up to 4 headline figures such as "Leads: 142, +38% vs last month"), **Then** it appears in the client's portal and all active members of the organisation are emailed a link to it.
2. **Given** a signed-in client, **When** they open reports, **Then** they see their organisation's reports newest first, filterable by project, each with period, title and headline figures.
3. **Given** a signed-in member of the owning organisation or an admin, **When** they choose "Download", **Then** the file downloads.
4. **Given** anyone else (not signed in, a member of another organisation, a deactivated contact, or someone reusing an old download link), **When** they try to download a report, **Then** access is refused and no file content is returned.
5. **Given** the report notification email, **When** it is sent, **Then** it contains no report file or figures, only a link that requires signing in.
6. **Given** a report uploaded in error, **When** an admin removes it, **Then** it disappears from the portal immediately.

---

### User Story 5 - Clients see their invoices (Priority: P2)

A client opens the invoices section and sees each invoice's number, amount, issue date, due date and status (Unpaid, Paid or Overdue), and can download the invoice document. Payment happens outside the portal.

**Why this priority**: Reduces "which invoices are outstanding?" messages, but billing already works outside the portal.

**Independent Test**: Add an unpaid invoice due yesterday, an unpaid invoice due next week and a paid invoice; confirm the client sees Overdue, Unpaid and Paid respectively, with correct amounts and dates, and that another organisation cannot see them.

**Acceptance Scenarios**:

1. **Given** a signed-in admin, **When** they add an invoice to an organisation (invoice number, optional project, amount and currency, issue date, due date, optional PDF), **Then** it appears in the client's portal with status "Unpaid".
2. **Given** an unpaid invoice past its due date, **When** the client views invoices, **Then** its status is shown as "Overdue" automatically.
3. **Given** an admin marks an invoice as paid with the payment date, **When** the client views invoices, **Then** its status is "Paid" with the payment date.
4. **Given** the invoices list, **When** it is shown, **Then** it displays totals outstanding per currency and payment instructions set by the admin (for example, bank transfer details), with no online payment.
5. **Given** an invoice PDF, **When** it is downloaded, **Then** the same access rules as reports apply.

---

### User Story 6 - Admins manage the portal (Priority: P1)

An admin manages organisations and their contacts, creates projects, updates stages, uploads reports, submits items for approval and adds invoices, all from the existing admin area.

**Why this priority**: Every client-facing story depends on it; it is delivered alongside Stories 1–3.

**Independent Test**: As an admin, perform each management action and confirm the client sees the result; as an editor, confirm none of these screens or actions are available.

**Acceptance Scenarios**:

1. **Given** a signed-in admin, **When** they open "Clients", **Then** they see organisations with country, number of active contacts, active projects, items awaiting client review and overdue invoices.
2. **Given** an organisation, **When** the admin manages it, **Then** they can invite, resend or cancel invitations for, deactivate and reactivate contacts; create and complete projects; change stages with notes; upload and remove reports; submit and revise approval items; and add, edit and mark invoices as paid.
3. **Given** approval items across all clients, **When** an admin views them, **Then** they can filter by status (Awaiting review, Changes requested, Approved) and see each item's full history.
4. **Given** a signed-in editor, **When** they try to open any portal management screen or action, **Then** they are refused (portal management is admin-only, feature 003).
5. **Given** any management action, **When** it is performed, **Then** it is recorded with the admin and time.

---

### User Story 7 - The public site in English, Urdu and Arabic (Priority: P3)

A visitor who prefers Urdu or Arabic switches the public website's language. Pages that have been translated appear in that language, with Urdu and Arabic laid out right to left. Search engines and screen readers know which language each page is in.

**Why this priority**: Widens reach in Pakistan and the UAE, but it is independent of the portal and depends on translated content being available.

**Independent Test**: Switch a translated page to Arabic and Urdu and confirm the text, layout direction, language settings and alternate-language links are correct; open an untranslated page in Urdu and confirm the defined fallback behaviour.

**Acceptance Scenarios**:

1. **Given** any public page, **When** a visitor uses the language switch (in the header and mobile menu, showing each language in its own script: English, اردو, العربية), **Then** they are taken to the same page in the chosen language, if it exists.
2. **Given** a page in Arabic or Urdu, **When** it is displayed, **Then** the whole layout reads right to left (navigation, text alignment, icons that indicate direction, forms), and text uses fonts suited to each script.
3. **Given** any language version of a page, **When** it is inspected by a search engine or screen reader, **Then** it declares its language and text direction correctly, has its own address, and links to its other language versions as alternates.
4. **Given** a visitor chooses a language, **When** they continue browsing, **Then** the choice is remembered on their device; the site does not redirect automatically based on location.
5. **Given** the translation scope [NEEDS CLARIFICATION: Which public content is translated into Urdu and Arabic, and who provides the translations? This also conflicts with features 007 (multi-language content out of scope) and 008 (chat assistant English only).], **When** a visitor opens a page that has not been translated, **Then** they see the English version with a short notice in their chosen language.
6. **Given** numbers, dates, phone numbers and prices on translated pages, **When** they are shown, **Then** they are formatted correctly for the language and remain readable.

---

### Edge Cases

- A contact's email address already belongs to a team member or to another organisation's contact: the invitation is refused with a clear message; one email address belongs to one account.
- The last active contact of an organisation is deactivated: the organisation remains, with no one able to sign in, and the admin sees a warning.
- A client is part-way through requesting changes when their access is deactivated: the submission is refused and nothing is recorded.
- Two members of the same organisation decide on the same item version at the same time: only the first decision is recorded; the second person sees the decision already made.
- An admin submits a new version while a client is reviewing the previous one: the client is told a newer version exists before deciding.
- A report or approval file is very large or of the wrong type: it is rejected with a clear message (reports: PDF up to 20 MB; approval items: JPEG, PNG, WebP up to 10 MB each, up to 10 images, or one PDF up to 20 MB).
- A download link is forwarded to someone outside the organisation: it does not work without signing in as a member of that organisation.
- An invoice is in a currency other than PKR (for example, AED or GBP for UAE and UK clients): it is shown in its own currency, and totals are shown per currency, never converted.
- A project is deleted by mistake: projects are completed or archived, not deleted, so reports and approvals remain.
- A translated page's English version is updated but its translation is not: the translation remains published, and editors can see which translations are older than their English source.
- Mixed-direction text (for example, an English brand name inside an Arabic sentence): it is displayed in the correct order.

## Requirements *(mandatory)*

### Functional Requirements

**Client accounts and access**

- **FR-001**: Admins MUST be able to create organisations (name, country, notes) and invite contacts by email to one organisation; each email address MUST belong to at most one account on the site.
- **FR-002**: Invitations MUST contain a single-use link valid for 72 hours; admins MUST be able to resend or cancel pending invitations.
- **FR-003**: Client sign-in, password rules, password reset, failed-attempt blocking, session timeouts and sign-out MUST follow the same rules as team accounts (feature 003). There MUST be no public self-registration.
- **FR-004**: Every portal page, file download and data request MUST be checked on the server so that a client can only access their own organisation's data; requests for another organisation's items MUST return "not found" and be recorded as security events.
- **FR-005**: Client accounts MUST NOT be able to access any admin area page or data, and team accounts' permissions MUST be unaffected by the portal.
- **FR-006**: Deactivating a contact or an organisation MUST end all affected sessions immediately and block sign-in, password reset and invitation acceptance; admins MUST be able to reactivate.
- **FR-007**: All active members of an organisation MUST have the same access within it (projects, reports, approvals, invoices).
- **FR-008**: Portal pages MUST NOT be indexed by search engines or displayable inside other sites' frames.

**Projects**

- **FR-009**: Admins MUST be able to create projects for an organisation (name, services from the five offered, start date), change the stage (Discovery & audit, Strategy, Execution & creative, Reporting & growth) with an optional note, and mark projects as completed; projects MUST NOT be deletable.
- **FR-010**: Clients MUST see each project's services, current stage, stage history with dates and update notes, and summary counts of items awaiting review and reports.

**Approvals**

- **FR-011**: Admins MUST be able to submit items for approval on a project with title, type (social post or design), files (JPEG, PNG or WebP up to 10 MB each, up to 10 images, or one PDF up to 20 MB), optional caption and optional due date.
- **FR-012**: On submission of an item or new version, all active members of the organisation MUST be emailed a link to it (with no files attached).
- **FR-013**: Clients MUST be able to approve an item version or request changes with a required comment of at least 5 characters; each decision MUST record the deciding person, the decision, any comment, and the date and time, and MUST be permanent for that version.
- **FR-014**: Admins MUST be able to upload a revised version after changes are requested; the full history of versions, decisions and comments MUST remain visible to the client and the team.
- **FR-015**: The team MUST be emailed when a client approves or requests changes, including the comment.
- **FR-016**: Only the first decision on a version MUST be recorded; later attempts MUST be told a decision already exists.

**Reports**

- **FR-017**: Admins MUST be able to upload monthly reports to a project (period, title, PDF up to 20 MB, optional summary, up to 4 headline figures) and remove reports uploaded in error.
- **FR-018**: All active members of the organisation MUST be emailed when a report is posted; the email MUST contain only a link that requires signing in, with no attachment or figures.
- **FR-019**: Report files MUST be downloadable only by signed-in active members of the owning organisation and by admins; every other request MUST be refused without returning file content, and download links MUST NOT work when shared.

**Invoices**

- **FR-020**: Admins MUST be able to add and edit invoices for an organisation (number, optional project, amount, currency: PKR, AED, GBP or USD, issue date, due date, optional PDF) and mark them as paid with a payment date.
- **FR-021**: Invoice status MUST be Unpaid, Paid or Overdue, where Overdue is shown automatically for unpaid invoices past their due date.
- **FR-022**: Clients MUST see their invoices with number, amount, currency, dates and status, totals outstanding per currency, and admin-set payment instructions; invoice files follow the same download rules as reports.
- **FR-023**: The portal MUST NOT take payments.

**Admin management and records**

- **FR-024**: All portal management (organisations, contacts, projects, stages, reports, approval items, invoices) MUST be available to admins only, not editors (feature 003).
- **FR-025**: Every management action, client decision, client sign-in and refused access attempt MUST be recorded with who, what and when, and kept for at least 24 months.
- **FR-026**: Admins MUST have an overview of organisations with active contacts, active projects, items awaiting client review and overdue invoices, and a cross-client list of approval items filterable by status.

**Portal experience**

- **FR-027**: The portal MUST be mobile-friendly and meet WCAG 2.1 AA, including keyboard operation, stage and status information conveyed in text, and labelled file downloads with type and size.
- **FR-028**: The portal MUST support the light and dark themes (feature 007). The portal is in English.

**Multilingual public site**

- **FR-029**: The public website MUST offer English, Urdu and Arabic, with a language switch in the header and mobile menu that shows each language in its own script and keeps the visitor on the equivalent page.
- **FR-030**: Urdu and Arabic pages MUST be displayed right to left throughout, with fonts suited to each script; English pages left to right.
- **FR-031**: Each language version of a page MUST have its own address, declare its language and text direction, reference its other language versions as alternates, and appear in the sitemap; titles, descriptions and share previews MUST be in the page's language.
- **FR-032**: The visitor's language choice MUST be remembered on their device; the site MUST NOT redirect automatically by location.
- **FR-033**: Pages without a translation MUST show the English version with a short notice in the chosen language; the scope of translated content is [NEEDS CLARIFICATION: see User Story 7, scenario 5].
- **FR-034**: Editors MUST be able to see which translations are missing or older than their English source.

### Key Entities

- **Organisation**: A client company. Name, country, notes, status (Active, Deactivated), payment instructions shown on invoices.
- **Client contact**: A person who can sign in to the portal for one organisation. Name, email, status (Invited, Active, Deactivated), last sign-in. Separate from team accounts.
- **Project**: Work for one organisation. Name, services, start date, current stage, stage history (stage, date, note, admin), status (Active, Completed).
- **Approval item**: Work submitted for client review on a project. Title, type, due date, and one or more versions.
- **Item version**: Files and caption for one round of review, with its decision (Awaiting review, Approved, Changes requested), who decided, when, and comments.
- **Report**: A monthly report for a project. Period, title, file, summary, headline figures, posted by and when.
- **Invoice**: Number, organisation, optional project, amount, currency, issue and due dates, status, payment date, optional file.
- **Portal activity record**: Who did what and when (management actions, decisions, sign-ins, refused access).
- **Page translation**: A language version (English, Urdu, Arabic) of a public page, with its address, content, direction and the date of the English source it was translated from.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In testing, 100% of attempts to access another organisation's projects, reports, approvals, invoices or files are refused, including by changing links and reusing download links.
- **SC-002**: 100% of approval decisions show who made them and when, and no decision can be altered after it is made.
- **SC-003**: 100% of report and invoice downloads by anyone other than signed-in members of the owning organisation or admins are refused.
- **SC-004**: A deactivated contact's next action is refused in 100% of cases.
- **SC-005**: A client can find their project's current stage, or approve an item, within 1 minute of signing in on a phone.
- **SC-006**: Within 3 months of launch, at least 80% of approvals for portal clients are made in the portal rather than over WhatsApp or email.
- **SC-007**: Within 3 months, project-status questions from portal clients over WhatsApp and email fall by at least 50%, as estimated by the team.
- **SC-008**: 100% of language versions of public pages declare the correct language and direction and link to their alternates, and Urdu and Arabic pages pass a right-to-left layout review with no mirrored-layout defects on key pages.

## Assumptions

- **Depends on** features 003 (sign-in, password, lockout and session rules, admin-only access; its out-of-scope "client accounts" are introduced here), 002 (SEO rules, sitemap, analytics), 004 (file upload conventions) and 007 (themes).
- **Client contacts** are a separate kind of account from team members, reusing the same security rules. One email belongs to one account, and one contact belongs to one organisation.
- **Equal access within an organisation**: All active members of an organisation can view everything and approve items. Different client roles (for example, finance-only access to invoices) can be added later.
- **Portal language**: The portal itself is English only; the multilingual requirement applies to the public website as stated in the brief.
- **Urdu is right to left**: The brief mentions only Arabic as right to left, but Urdu is also written right to left, so both are displayed that way.
- **Invoices** are records for visibility only; accounting and payments stay outside the site. Currencies are PKR, AED, GBP and USD because clients are in Pakistan, the UAE and the UK.
- **Notifications**: Clients are emailed for new approval items and new reports; stage changes appear in the portal without an email to avoid noise.
- **Retention**: Portal records and files are kept while the client relationship is active and for 24 months after the organisation is deactivated, then deleted, unless the contract says otherwise; this will be reflected in the privacy policy (feature 002).
- **Scope note**: User Story 7 (multilingual public site) is independent of the portal and conflicts with earlier decisions (feature 007 excluded multi-language content; feature 008 keeps the chat assistant in English). It may be better planned as its own feature.
- **Out of scope**: Online payments, in-portal chat, a mobile app, client-uploaded files, client roles within an organisation, contacts belonging to several organisations, and a translated portal.
