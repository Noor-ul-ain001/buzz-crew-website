# Feature Specification: Free Website Audit Tool

**Feature Branch**: `009-website-audit-tool`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Offer a free website audit tool that shows The Buzz Crew's SEO expertise and generates qualified leads. [...] Out of scope: multi-page site crawls, competitor comparisons, scheduled re-audits."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Audit a website and see the summary (Priority: P1)

A business owner enters their website address on the free audit page. While the audit runs, they see its progress. Within about a minute they see an overall performance score, an overall SEO score, and the most important issues found, in plain language.

**Why this priority**: This is the tool's core value and the hook that draws visitors in. On its own it demonstrates the agency's expertise.

**Independent Test**: Enter the address of a real public website and confirm that within 60 seconds a summary appears with a performance score, an SEO score and a list of top issues, each consistent with the measured checks.

**Acceptance Scenarios**:

1. **Given** the audit page, **When** a visitor enters a website address (with or without "https://" or "www") and starts the audit, **Then** they see progress through clear steps (for example, "Fetching page", "Checking SEO", "Measuring speed") and an announcement of progress for screen-reader users.
2. **Given** a reachable public website, **When** the audit finishes, **Then** within 60 seconds for at least 90% of audits the visitor sees an overall performance score and an overall SEO score (each 0–100, labelled Good, Needs work or Poor) and up to 5 top issues ordered by impact.
3. **Given** the summary, **When** it is shown, **Then** it names the exact address audited (after any redirects) and the date and time of the audit, and states that it covers the home page (or entered page) only.
4. **Given** an invalid address (for example, "my shop", a malformed address or an unsupported scheme), **When** the visitor starts the audit, **Then** an inline error explains what a valid address looks like, and no audit runs.
5. **Given** an address that cannot be reached (does not exist, times out, returns an error, requires a login or blocks automated access), **When** the audit runs, **Then** it stops with a clear message explaining the reason in plain language and what to try next, and no partial report is shown or stored.
6. **Given** an audit that has not finished within 90 seconds, **When** that time passes, **Then** it stops with a message to try again later, and no partial report is shown or stored.
7. **Given** the summary, **When** it is shown, **Then** a call to action invites the visitor to get the full report by email or to talk to the team.

---

### User Story 2 - See the individual checks (Priority: P1)

The business owner sees the result of each check: page title, meta description, heading structure, image alternative text, mobile friendliness and page speed, each marked as passed, needs work or failed, with a one-line explanation.

**Why this priority**: The individual checks make the scores credible and show the agency's SEO knowledge.

**Independent Test**: Audit test pages built with known problems (missing title, over-long description, no main heading, images without alternative text, no mobile setup, heavy page) and confirm each check reports the expected result.

**Acceptance Scenarios**:

1. **Given** an audited page, **When** the checks are shown, **Then** each of the six checks shows a status (Passed, Needs work, Failed) and a one-sentence plain-language explanation.
2. **Given** the page title check, **When** it runs, **Then** it reports whether a title exists, its length, and flags titles missing, shorter than 10 characters or longer than 60 characters.
3. **Given** the meta description check, **When** it runs, **Then** it reports whether a description exists, its length, and flags descriptions missing, shorter than 70 characters or longer than 160 characters.
4. **Given** the heading structure check, **When** it runs, **Then** it reports the number of main headings (flagging none or more than one) and headings that skip levels.
5. **Given** the image alternative text check, **When** it runs, **Then** it reports how many images have no alternative text out of the total.
6. **Given** the mobile friendliness check, **When** it runs, **Then** it reports whether the page is set up to fit phone screens, whether text is readable without zooming and whether tap targets are large enough.
7. **Given** the page speed check, **When** it runs, **Then** it reports how quickly the main content appears, how quickly the page responds and how much the layout shifts on a typical phone connection, each rated against widely used thresholds.

---

### User Story 3 - Understand the most important fixes (Priority: P1)

Below the checks, the business owner reads a short, plain-language explanation of their three to five most important fixes: what is wrong, why it matters for their business and what to do about it, written by AI from the measured results only.

**Why this priority**: Business owners rarely understand technical reports. A plain explanation is what makes the tool useful and positions the agency as the expert to fix it.

**Independent Test**: For several audited pages, compare the explanation with the measured results and confirm every fix it mentions corresponds to a failed or needs-work check, every number it quotes matches the measurements, and it mentions no scores or issues that were not measured.

**Acceptance Scenarios**:

1. **Given** a completed audit with at least 3 issues, **When** the explanation is shown, **Then** it covers 3 to 5 fixes, each with what is wrong, why it matters and a first step to fix it, in plain English of about 250 words in total.
2. **Given** a completed audit with fewer than 3 issues, **When** the explanation is shown, **Then** it covers only the real issues and says what is working well, without inventing further problems.
3. **Given** the explanation, **When** it quotes a score, count or measurement, **Then** the value matches the audit's measured result exactly.
4. **Given** the explanation, **When** it is displayed, **Then** it is marked as AI-generated and does not promise rankings, traffic or results.
5. **Given** the AI service is unavailable or produces an explanation that does not match the measured results, **When** the audit completes, **Then** the visitor sees a standard written explanation of the top issues (prepared by the agency for each check) instead, and the audit still succeeds.

---

### User Story 4 - Get the full report by email (Priority: P2)

The business owner wants to keep the results and share them with their web developer. They enter their name and email, agree to be contacted about the results, and receive an email with the full report and a private link to view it online. The agency can now follow up.

**Why this priority**: This is how the tool generates leads. It depends on the audit (Stories 1–3) existing first.

**Independent Test**: Complete an audit, request the full report with a name and email, and confirm the email arrives within 2 minutes with the full report and a working private link; confirm no email is sent for audits where no email was entered.

**Acceptance Scenarios**:

1. **Given** a completed audit, **When** the visitor chooses "Email me the full report", **Then** a short form asks for name (required), email (required), business name (optional) and states that the agency may contact them about the results, with a link to the privacy policy.
2. **Given** valid details, **When** the visitor submits, **Then** they see a confirmation, and within 2 minutes they receive an email containing the scores, every check with its details and how to fix it, the explanation of top fixes, and a private link to the online report.
3. **Given** invalid details (missing name, invalid email), **When** the visitor submits, **Then** inline errors are shown and nothing is sent or stored.
4. **Given** a visitor who has not submitted the form, **When** the audit completes, **Then** no email is sent to anyone.
5. **Given** the form, **When** it is shown, **Then** it offers an unticked option to also subscribe to the newsletter (which follows the confirmation process in feature 007).
6. **Given** the email cannot be sent, **When** the request is processed, **Then** the lead is still created, the failure is recorded, and the visitor still sees the report link on screen.
7. **Given** the private report link, **When** anyone opens it, **Then** they see the full report, the page is not indexed by search engines, and the link cannot be guessed.

---

### User Story 5 - Audit leads reach the agency (Priority: P2)

When a visitor requests the full report, a lead is created in the leads manager, tagged with the source "Website audit", with the audited address, the scores and a link to the report, so the team can follow up with context.

**Why this priority**: Turns tool usage into business; it depends on Story 4.

**Independent Test**: Request a full report and confirm a lead appears for admins with status "New", source "Website audit", the audited address, both scores and a working report link; confirm editors cannot see it.

**Acceptance Scenarios**:

1. **Given** a visitor requests the full report, **When** the lead is created, **Then** it has status "New", the submission time, the visitor's name, email and business name, source "Website audit", the audited address, both scores and a link to the report.
2. **Given** a new audit lead, **When** it is created, **Then** the team receives the same new-lead notification as for inquiries (feature 001), including the scores and report link.
3. **Given** a visitor who already has an open lead with the same email from the last 30 days, **When** they request another report, **Then** the new report is added to that lead instead of creating a duplicate.
4. **Given** a signed-in editor, **When** they try to view audit leads or reports through the admin area, **Then** they are refused (feature 003).
5. **Given** the visitor later submits the inquiry form with the same email, **When** the lead is stored, **Then** it is linked to their audit.

---

### Edge Cases

- The entered address redirects (for example, from "http" to "https" or to "www"): the audit follows up to 5 redirects and reports the final address; more redirects than that are reported as a problem, not a crash.
- The address points to a private network, the visitor's own computer, an internal address or a non-web resource (such as a PDF or image): the audit is refused with a clear message.
- The same website is audited by many visitors at once or repeatedly: no more than 10 audits of the same website are run per hour; later requests are shown the most recent report from within the last hour instead of re-running.
- The page is extremely large or slow to download: the audit stops the download at a safe size and reports the page as too large, as a page speed issue.
- The page has no images: the image check is marked "Not applicable", not "Passed" or "Failed".
- The website is in a language other than English: checks still run; the explanation is in English.
- The visitor starts a second audit while one is running: the first continues and the second waits or is refused with a message.
- The visitor has reached the daily limit: they see a friendly message with the reset time and an invitation to contact the team.
- The visitor enters the agency's own website: the audit runs normally.
- A visitor tries to use the tool to probe or overload someone else's site: per-website limits and bot protection prevent heavy use, and the tool fetches only one page per audit.

## Requirements *(mandatory)*

### Functional Requirements

**Running an audit**

- **FR-001**: Visitors MUST be able to start an audit by entering a website address; addresses without a scheme MUST be treated as secure web addresses, and invalid addresses MUST be rejected with an inline explanation before any audit starts.
- **FR-002**: The tool MUST audit only the single entered page (normally the home page), following up to 5 redirects, and MUST state this in the results.
- **FR-003**: The tool MUST only analyse publicly accessible web pages: it MUST refuse addresses on private or internal networks, the local machine, non-web schemes and non-page files, and MUST NOT bypass logins, paywalls or access blocks.
- **FR-004**: The audit MUST show progress through named steps and complete within 60 seconds for at least 90% of reachable sites; audits not complete within 90 seconds MUST stop.
- **FR-005**: Any failure (unreachable, error response, timeout, blocked, invalid content) MUST produce a clear, plain-language error with a suggestion, and MUST NOT show or store a partial report.

**Checks and scores**

- **FR-006**: Each audit MUST run six checks: page title, meta description, heading structure, image alternative text, mobile friendliness and page speed, each producing Passed, Needs work, Failed or Not applicable, with a one-sentence explanation and the measured details (as described in User Story 2).
- **FR-007**: Each audit MUST produce an overall performance score and an overall SEO score from 0 to 100, labelled Good (90–100), Needs work (50–89) or Poor (0–49), measured for a typical phone on a typical mobile connection.
- **FR-008**: The summary MUST list up to 5 top issues ordered by their expected impact.
- **FR-009**: Check thresholds MUST be consistent with the standards the agency applies to its own site (feature 002) and be documented in the report ("How we check").

**AI explanation**

- **FR-010**: Each completed audit MUST include a plain-language explanation of the 3–5 most important fixes (or fewer if fewer issues exist), each with what is wrong, why it matters and a first step, about 250 words in total, marked as AI-generated.
- **FR-011**: The explanation MUST be based only on the audit's measured results: every issue it mentions MUST correspond to a Failed or Needs work check, and every number MUST match a measured value; the explanation MUST NOT invent scores, issues or promises of rankings, traffic or results.
- **FR-012**: The explanation MUST be checked against the measured results before it is shown; if it fails the check, or the AI service is unavailable, a standard pre-written explanation for the failed checks MUST be shown instead.

**Full report and lead capture**

- **FR-013**: Visitors MUST be able to request the full report by entering name (required), email (required, valid) and business name (optional); the form MUST state that the agency may contact them about the results and link to the privacy policy.
- **FR-014**: Report emails MUST be sent only after the visitor submits this form, only to the address entered, within 2 minutes, containing the full report and a private report link.
- **FR-015**: The form MUST offer an optional, unticked newsletter subscription that follows the confirmation process in feature 007.
- **FR-016**: Each report MUST have a private, unguessable online link that is not indexed by search engines.
- **FR-017**: Requesting the full report MUST create a lead with status "New", source "Website audit", the visitor's details, audited address, both scores and the report link, and trigger the team notification (feature 001); a request from an email with an open lead from the last 30 days MUST be added to that lead instead.
- **FR-018**: If the report email fails, the lead MUST still be created, the failure recorded, and the report link shown on screen.
- **FR-019**: Audit leads and reports MUST be visible in the admin area to admins only (feature 003).

**Limits and abuse protection**

- **FR-020**: Each visitor MUST be limited to 3 audits per day (resetting at midnight Pakistan time), with a friendly message on reaching the limit that shows the reset time and offers contact options.
- **FR-021**: The same website MUST NOT be audited more than 10 times per hour across all visitors; later requests within the hour MUST be shown the most recent report instead.
- **FR-022**: Audits and report requests MUST use bot protection and per-visitor limits (as for the inquiry form, feature 001).

**Data handling**

- **FR-023**: The tool MUST NOT store the audited page's content beyond what appears in the report (for example, the title text, description text, heading outline and counts); downloaded page content MUST be discarded when the audit ends.
- **FR-024**: Reports not linked to a lead MUST be deleted after 90 days; reports linked to a lead follow the lead retention period (feature 002).
- **FR-025**: The system MUST record events for audits started, completed and failed (by failure type), limit reached, full report requested and report link opened, without personal data (feature 002).

**Accessibility**

- **FR-026**: The audit form, progress, results and report form MUST be usable with a keyboard and screen reader, with progress and results announced, and scores conveyed by text as well as colour.

### Key Entities

- **Audit**: One run of the tool against one address. Entered and final address, start and finish time, outcome (completed or failure reason), visitor limit record.
- **Audit report**: The results of a completed audit. Performance and SEO scores, six check results with measured details, top issues, the explanation (AI-generated or standard), private link, and expiry date.
- **Check result**: One check's status, explanation and measured values (for example, title length, number of images without alternative text, speed measurements).
- **Audit lead**: A lead (feature 001) created from a full-report request, with source "Website audit", linked to one or more audit reports.
- **Usage limit record**: Per-visitor daily audit count and per-website hourly count, containing no personal data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of audits of reachable public websites show results within 60 seconds.
- **SC-002**: 100% of invalid or unreachable addresses produce a clear error, and 0 partial reports are shown or stored.
- **SC-003**: On a set of at least 20 test pages with known problems, each of the six checks reports the expected result in 100% of cases.
- **SC-004**: On a review of at least 30 audits, 100% of AI explanations mention only measured issues and quote only measured values, with 0 invented scores, issues or promises.
- **SC-005**: 0 report emails are sent without the visitor submitting the report form.
- **SC-006**: 100% of full-report requests create (or update) a lead with the "Website audit" source, scores and report link.
- **SC-007**: A business owner can go from entering an address to seeing their results and requesting the report in under 3 minutes on a phone.
- **SC-008**: Within 3 months of launch, at least 20% of completed audits lead to a full-report request.
- **SC-009**: 0 audits of private or internal network addresses are performed.

## Assumptions

- **Depends on** features 001 (lead storage, team notifications, bot protection), 002 (the agency's SEO and speed thresholds, analytics, privacy policy, lead retention), 003 (admin-only access) and 007 (newsletter confirmation).
- **Existing prototype**: A prototype audit tool, report page and 3-per-day limit already exist with sample data; this feature defines the complete behaviour they must meet. The daily limit of 3 audits per visitor matches the prototype.
- **On-screen versus emailed**: Scores, the six check results, top issues and the explanation are shown on screen without asking for details, so the tool gives real value first. The full report (detailed findings for each check, the affected items and step-by-step fixes, and "How we check") is sent by email and via the private link.
- **Measurement** is for a typical phone on a typical mobile connection, because most of the agency's prospects browse on phones. Desktop scores are not shown.
- **Consent**: Requesting the report means agreeing to be contacted about the results; newsletter subscription is separate and optional.
- **Report retention**: Reports not linked to a lead are deleted after 90 days. The lead retention period is still to be decided in feature 002.
- **Language**: English only.
- **Out of scope**: Multi-page site crawls, competitor comparisons, scheduled re-audits, downloadable PDF reports, backlink or keyword ranking analysis, and audits of pages behind logins.
