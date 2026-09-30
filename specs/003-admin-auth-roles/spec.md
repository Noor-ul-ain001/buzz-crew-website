# Feature Specification: Secure Admin Access and Team Roles

**Feature Branch**: `003-admin-auth-roles`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Add a secure admin area to The Buzz Crew website so the agency team can manage leads and content. Lead data is confidential client information and must never be visible to the public. Roles: Admin (full access, including leads, content, users and settings); Editor (can manage website content but cannot view, export or delete leads). [...] Out of scope: client accounts (a later client portal feature), single sign-on, two-factor authentication."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Only signed-in team members can reach the admin area (Priority: P1)

A team member opens the admin area, is asked to sign in with their email and password, and then works normally for the rest of their working day. Anyone who is not signed in, including a member of the public who guesses an admin address, sees only the sign-in page and never any lead or admin data.

**Why this priority**: The admin area already contains lead, applicant and subscriber pages. Until access is enforced, confidential client information is at risk. This story alone makes the admin area safe to deploy.

**Independent Test**: Without signing in, open several admin addresses and request admin data directly; confirm every attempt ends at the sign-in page or is refused with no data returned. Then sign in with valid credentials and confirm the admin area opens and stays available during continued use.

**Acceptance Scenarios**:

1. **Given** a visitor who is not signed in, **When** they open any admin page (including a deep address such as a specific lead), **Then** they are sent to the sign-in page and, after signing in successfully, returned to the page they originally asked for.
2. **Given** a request for protected data without a valid session, **When** it is received, **Then** it is refused with a "not authorised" response and no protected data is included.
3. **Given** a team member with an active account, **When** they sign in with the correct email and password, **Then** they reach the admin area.
4. **Given** a sign-in attempt with an unknown email or a wrong password, **When** it is submitted, **Then** the same general "email or password is incorrect" message is shown in both cases, without revealing which part was wrong or whether the account exists.
5. **Given** a signed-in team member who keeps working, **When** they remain active through a working day, **Then** they are not asked to sign in again until the maximum session length is reached.
6. **Given** admin pages, **When** a search engine or link preview service requests them, **Then** they are not indexed and reveal no admin content.

---

### User Story 2 - Editors cannot see confidential lead data (Priority: P1)

An editor signs in to update website content (posts, FAQs, team members, testimonials, client logos, job listings). They do not see leads, applicants or newsletter subscribers anywhere in the admin area, and if they type the address of a lead page directly or request lead data directly, they are refused.

**Why this priority**: Role separation is the core promise of the brief: lead data must be restricted to admins even among the team. It must be in place before any editor account is created.

**Independent Test**: Sign in as an editor, confirm lead, applicant, subscriber, user-management and settings sections are not shown, then open each of those addresses directly and request their data directly; confirm every attempt is refused and nothing confidential appears.

**Acceptance Scenarios**:

1. **Given** a signed-in editor, **When** they view the admin navigation and dashboard, **Then** only content sections are shown, and no lead counts, names or summaries appear anywhere.
2. **Given** a signed-in editor, **When** they type the address of the leads list or a specific lead, **Then** they see a "you don't have access" page and no lead data is sent to their browser.
3. **Given** a signed-in editor, **When** protected lead, applicant, subscriber, user or settings data is requested using their session, **Then** the request is refused with a "forbidden" response.
4. **Given** a signed-in editor, **When** they attempt to export or delete leads by any means, **Then** the action is refused and nothing is exported or deleted.
5. **Given** a signed-in admin, **When** they use the admin area, **Then** they can reach leads, applicants, subscribers, content, user management and settings.

---

### User Story 3 - Sessions end on inactivity or when the team member signs out (Priority: P1)

A team member who steps away from a shared or office computer is signed out automatically after a period of inactivity. A team member who finishes work can sign out at any time, and the session can no longer be used afterwards.

**Why this priority**: Office and shared devices are common, and an unattended signed-in screen exposes lead data as surely as no sign-in at all.

**Independent Test**: Sign in, stay idle past the inactivity limit and confirm the next action requires signing in again; sign in again, sign out, and confirm going back or reusing the old session does not show admin data.

**Acceptance Scenarios**:

1. **Given** a signed-in team member, **When** they are inactive for 30 minutes, **Then** their session ends and their next action takes them to the sign-in page, with a message explaining they were signed out due to inactivity.
2. **Given** a signed-in team member who is inactive for 28 minutes, **When** the admin area is open on screen, **Then** they see a warning that they will be signed out soon, with an option to stay signed in.
3. **Given** a signed-in team member, **When** they choose "Sign out", **Then** the session ends immediately, they are shown the sign-in page, and using the browser's back button or the old session shows no admin data.
4. **Given** any session, **When** 12 hours have passed since sign-in, **Then** it ends regardless of activity.
5. **Given** a team member signed in on two devices, **When** they sign out on one, **Then** only that device's session ends.

---

### User Story 4 - Admins manage the team's accounts (Priority: P2)

An admin invites a new team member by email and chooses their role. The invitee receives an email with a link to set their own password and activate their account. Later, the admin can change the person's role or deactivate their account when they leave, and the change takes effect immediately.

**Why this priority**: Needed as soon as there is more than one person on the team, but the first admin account can exist without it.

**Independent Test**: As an admin, invite a new person as an editor, accept the invitation from the email and sign in; change them to admin and confirm new sections appear; deactivate them and confirm they are signed out and cannot sign in again.

**Acceptance Scenarios**:

1. **Given** a signed-in admin, **When** they invite a person with an email address and a role (Admin or Editor), **Then** the person appears in the team list as "Invited" and receives an email with a single-use link to set their password.
2. **Given** an invited person, **When** they open the link within 72 hours and set a password that meets the password rules, **Then** their account becomes "Active" with the assigned role and they are signed in.
3. **Given** an invitation older than 72 hours or already used, **When** its link is opened, **Then** it is refused with a message to ask an admin for a new invitation, and an admin can resend or cancel the invitation.
4. **Given** an admin invites an email already belonging to a team member, **When** they submit, **Then** they are told the person already has an account and no duplicate is created.
5. **Given** a signed-in admin, **When** they change a team member's role, **Then** the new permissions apply from that team member's very next action, including sessions already open.
6. **Given** a signed-in admin, **When** they deactivate a team member, **Then** all of that person's active sessions end immediately, they cannot sign in again, and their account remains in the list as "Deactivated" so it can be reactivated later.
7. **Given** there is only one active admin, **When** anyone tries to deactivate that admin or change their role to Editor, **Then** the change is refused with an explanation, so the agency is never locked out.
8. **Given** a signed-in editor, **When** they open user management or attempt any account change, **Then** they are refused.

---

### User Story 5 - Team members can reset a forgotten password (Priority: P2)

A team member who has forgotten their password asks for a reset from the sign-in page, receives an email with a time-limited link, and chooses a new password. Their old password stops working.

**Why this priority**: Without it, a forgotten password means an admin or developer has to intervene, but it is not needed for the first secure release.

**Independent Test**: Request a reset for an active account, use the emailed link to set a new password, confirm the new password works and the old one does not, and confirm the link cannot be reused.

**Acceptance Scenarios**:

1. **Given** the sign-in page, **When** a person requests a password reset for any email address, **Then** they see the same message ("If an account exists for this email, we've sent a reset link") whether or not the account exists.
2. **Given** an active account, **When** a reset is requested, **Then** an email is sent containing a single-use link that expires after 1 hour, and the email contains no password.
3. **Given** a valid reset link, **When** the team member sets a new password that meets the password rules, **Then** the new password works, the old one no longer works, all other sessions for that account end, and the team member receives an email confirming the password was changed.
4. **Given** an expired, already-used or altered reset link, **When** it is opened, **Then** it is refused with a message to request a new one.
5. **Given** a deactivated account, **When** a reset is requested, **Then** no reset email is sent and the on-screen message is the same as for any other request.

---

### User Story 6 - Automated guessing of passwords is blocked (Priority: P2)

Someone who repeatedly enters wrong passwords, whether a person or an automated script, is temporarily blocked from further attempts, so accounts cannot be broken into by guessing.

**Why this priority**: Essential protection for an internet-facing sign-in page holding confidential data; listed separately so it can be tested on its own.

**Independent Test**: Enter a wrong password repeatedly for one account and from one location, and confirm further attempts are blocked for the stated period with a clear message, even if the correct password is then entered.

**Acceptance Scenarios**:

1. **Given** 5 failed sign-in attempts for the same account within 15 minutes, **When** a sixth attempt is made, **Then** sign-in for that account is blocked for 15 minutes with a message saying to try again later or reset the password, even if the password is now correct.
2. **Given** 20 failed sign-in attempts from the same location within 15 minutes across any accounts, **When** another attempt is made from there, **Then** it is blocked for 15 minutes.
3. **Given** a block has expired, **When** the team member signs in with the correct password, **Then** they succeed.
4. **Given** an account is blocked, **When** it happens, **Then** the account holder receives an email notice about repeated failed attempts, which contains no password.
5. **Given** repeated password-reset or invitation-link attempts, **When** they exceed 5 per email address per hour, **Then** further requests are refused with a "try again later" message.

---

### Edge Cases

- A session expires while the team member is part-way through editing content: they are asked to sign in again and, where possible, returned to the same page; unsaved changes are not silently discarded without warning.
- A team member's role is changed from Admin to Editor while they are viewing a lead: their next action is refused and no further lead data is sent.
- A team member is deactivated while signed in on several devices: every session ends at the next action on each device.
- An admin tries to deactivate their own account or remove their own admin role: refused if they are the last active admin; otherwise allowed with a confirmation warning.
- An invitation is sent to an email address with different capitalisation from an existing account: it is treated as the same address.
- The invitation or reset email fails to send: the admin (or requester) is told the email could not be sent and can retry; no password is ever shown instead.
- A reset link is requested several times: only the most recent link works.
- Someone opens the sign-in page while already signed in: they are taken straight to the admin area.
- The sign-in page is opened inside another site's frame: it refuses to display, to prevent disguised sign-in pages.
- Two admins change the same team member's role at the same time: the last change is applied and both admins see the final result.

## Requirements *(mandatory)*

### Functional Requirements

**Access control**

- **FR-001**: Every admin page MUST require a valid signed-in session; visitors without one MUST be sent to the sign-in page and returned to the originally requested admin page after successful sign-in (only to pages within the admin area).
- **FR-002**: Every request for protected data or protected actions MUST be checked for a valid session and the required role on the server, independently of what the interface shows; requests without a valid session MUST be refused as "not authorised" and requests with insufficient role as "forbidden", with no protected data in the response.
- **FR-003**: The system MUST support two roles with these permissions:

  | Area | Admin | Editor |
  |------|-------|--------|
  | Website content (posts, FAQs, team, testimonials, client logos, job listings) | Full | Full |
  | Leads (view, update, export, delete) | Full | None |
  | Job applicants | Full | None |
  | Newsletter subscribers | Full | None |
  | Team accounts (invite, change role, deactivate) | Full | None |
  | Settings (for example, pricing) | Full | None |

- **FR-004**: The admin navigation, dashboard and search MUST show only the sections the signed-in role can access; no confidential lead, applicant or subscriber data (including counts and previews) may appear for editors.
- **FR-005**: Admin pages MUST be excluded from search engines and MUST NOT be displayable inside other websites' frames.
- **FR-006**: Admin pages containing confidential data MUST NOT be stored by the browser in a way that lets them be viewed after signing out (for example, via the back button).

**Sign-in and sessions**

- **FR-007**: Team members MUST sign in with their email address (not case-sensitive) and password.
- **FR-008**: Failed sign-ins MUST show one general message that does not reveal whether the email exists, whether the password was wrong, or whether the account is deactivated.
- **FR-009**: Sessions MUST end after 30 minutes without activity and after 12 hours from sign-in, whichever comes first; the team member MUST be warned 2 minutes before an inactivity sign-out and be able to extend the session.
- **FR-010**: Team members MUST be able to sign out at any time; signing out MUST end that session immediately so it cannot be reused.
- **FR-011**: Session credentials MUST NOT be readable by page scripts or sent over insecure connections, and MUST be issued fresh on each sign-in.

**Brute-force protection**

- **FR-012**: After 5 failed sign-in attempts for one account within 15 minutes, that account MUST be blocked from signing in for 15 minutes, and the account holder MUST be notified by email.
- **FR-013**: After 20 failed sign-in attempts from one location within 15 minutes, further attempts from that location MUST be blocked for 15 minutes.
- **FR-014**: Password-reset and invitation requests MUST be limited to 5 per email address per hour.

**Passwords**

- **FR-015**: Passwords MUST be at least 12 characters long, MUST NOT match the account's email address, and MUST NOT be a commonly used or known-breached password; the rules MUST be shown when setting a password.
- **FR-016**: Passwords MUST never be displayed (other than to the person typing them, on request), emailed, recorded in logs, error reports or analytics, or stored in a recoverable form.
- **FR-017**: Admins MUST NOT be able to see or set another team member's password; account setup and recovery always happen through emailed links.
- **FR-018**: Changing or resetting a password MUST end all other sessions for that account and send a confirmation email to the account holder.

**Invitations and account management (admins only)**

- **FR-019**: Admins MUST be able to invite a person by email with a role; the invitation email MUST contain a single-use link valid for 72 hours to set a password and activate the account.
- **FR-020**: Admins MUST be able to see all team accounts with name, email, role, status (Invited, Active, Deactivated) and last sign-in time; and to resend or cancel pending invitations.
- **FR-021**: Admins MUST be able to change a team member's role; the change MUST apply from that member's next action, including already-open sessions.
- **FR-022**: Admins MUST be able to deactivate and reactivate accounts; deactivation MUST end all of that account's sessions immediately and prevent sign-in, password reset and invitation acceptance.
- **FR-023**: The system MUST prevent any change that would leave no active admin.
- **FR-024**: Deactivated accounts MUST be kept (not deleted) so their past actions remain attributable.

**Password reset**

- **FR-025**: Anyone MUST be able to request a password reset from the sign-in page; the on-screen response MUST be identical whether or not an active account exists for the email.
- **FR-026**: Reset links MUST be single-use, expire after 1 hour, and be invalidated when a newer link is issued or the password is changed.

**Security activity record**

- **FR-027**: The system MUST record security events: successful and failed sign-ins, sign-outs, lockouts, password resets and changes, invitations sent and accepted, role changes, deactivations and reactivations, and refused access attempts to restricted areas. Each record MUST include the time, the account involved, the team member who performed the action (where applicable) and the originating location, and MUST NOT include passwords or reset/invitation links.
- **FR-028**: Security records MUST be kept for at least 12 months and MUST NOT be editable or deletable through the admin area.

**Initial setup**

- **FR-029**: There MUST be a controlled way to create the first admin account at deployment time that does not rely on a public sign-up page. The admin area MUST NOT offer public self-registration.

### Key Entities

- **Team member account**: A person on the agency team who can use the admin area. Has name, email (unique, not case-sensitive), role (Admin or Editor), status (Invited, Active, Deactivated), a protected password, creation date and last sign-in time.
- **Session**: One signed-in instance of a team member on one device. Has start time, last activity time, and end time/reason (signed out, inactivity, maximum length, deactivated, password changed).
- **Invitation**: An offer for a person to join the team with a given role. Has email, role, inviting admin, sent time, expiry (72 hours) and state (pending, accepted, expired, cancelled). Single use.
- **Password reset request**: A time-limited (1 hour), single-use permission to set a new password for one account.
- **Security event**: An unchangeable record of a sign-in, account or access event, with time, account, acting team member, originating location and outcome. Contains no passwords or links.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of admin pages and protected data requests tested without a session are redirected to sign-in or refused, with zero confidential data returned.
- **SC-002**: 100% of lead, applicant, subscriber, team-account and settings pages and data requests tested with an editor session are refused, including direct address entry.
- **SC-003**: A team member can sign in in under 30 seconds, and is not asked to sign in again during 8 hours of continuous use.
- **SC-004**: An idle session is unusable within 31 minutes of the last activity; a signed-out or deactivated session is unusable immediately.
- **SC-005**: An admin can invite a new team member in under 1 minute, and the invitee can activate their account and sign in within 5 minutes of receiving the email.
- **SC-006**: A team member can reset a forgotten password in under 3 minutes, without contacting anyone.
- **SC-007**: Password-guessing is limited to at most 5 attempts per account per 15 minutes.
- **SC-008**: A review of logs, error reports, analytics, emails and security records finds 0 passwords.
- **SC-009**: A deactivated account fails 100% of sign-in, reset and invitation-acceptance attempts.
- **SC-010**: An external security check of the sign-in page and admin area finds no way to reach lead data without an admin session.

## Assumptions

- **Existing admin screens**: The admin area already has screens for leads, job applicants, newsletter subscribers, website content and pricing settings (currently with sample data and no sign-in). This feature protects all of them; building or changing their functionality (for example, lead management itself) belongs to other features.
- **Applicants and subscribers are confidential**: The brief restricts leads to admins. Job applicants and newsletter subscribers are also personal data, so they are treated the same way: admin only. Editors can manage published job listings (content) but not applications.
- **Settings are admin only**, as stated in the brief. Pricing ranges shown on the site count as settings.
- **Session lengths**: "A working session" is taken as up to 12 hours from sign-in, with a 30-minute inactivity timeout. These fit an office working day while limiting risk on shared machines.
- **Lockout thresholds**: 5 failed attempts per account or 20 per location within 15 minutes, blocking for 15 minutes. Temporary blocking (not permanent lockout) avoids letting an attacker lock real team members out indefinitely.
- **Password rules** follow current good practice (length and breached-password checks rather than forced symbols or regular expiry).
- **Team size** is small (under 20 accounts), so no search, bulk actions or groups are needed in user management.
- **Email delivery**: The site's existing email service (also used by the inquiry flow, feature 001) sends invitation, reset, lockout and password-changed emails.
- **First admin** is created by the developer during deployment; after that, all accounts are created by invitation.
- **Language**: The admin area and its emails are in English only.
- **Out of scope**: Client accounts and the client portal, single sign-on, two-factor authentication, self-service profile changes beyond password (such as changing one's own email), viewing the security activity record in the admin area (it is kept for investigation and can be exposed in a later feature), and permanent deletion of team accounts.
