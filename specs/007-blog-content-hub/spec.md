# Feature Specification: Blog, Industry Pages, Newsletter, FAQ, Careers and Theme

**Feature Branch**: `007-blog-content-hub`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Grow The Buzz Crew's organic search traffic and audience with regularly published content, plus supporting pages that answer common questions and attract talent. [...] Out of scope: comments on posts, sending newsletters (only collecting subscribers), multi-language content."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read and browse the blog (Priority: P1)

A reader arrives from search or social media on a blog post, reads it comfortably on their phone, and sees who wrote it, when it was published and how long it takes to read. They then browse the blog, narrowing posts by category (for example, SEO) or by tag (for example, "Karachi").

**Why this priority**: Regular, well-structured posts are the main engine for organic search traffic, which is the purpose of this feature.

**Independent Test**: Publish several posts across categories and tags; open a post and confirm author, publish date and reading time are shown; open the blog, filter by a category and a tag, and confirm only matching published posts appear.

**Acceptance Scenarios**:

1. **Given** a published post, **When** a reader opens it, **Then** they see the title, cover image, author (name, role and photo), publish date, reading time, category and tags, followed by the post body.
2. **Given** a post that was updated after publishing, **When** it is viewed, **Then** the "last updated" date is also shown.
3. **Given** the blog home, **When** a reader opens it, **Then** published posts are listed newest first as cards (cover image, title, excerpt, category, date, reading time), 12 per page, with numbered pages.
4. **Given** the blog, **When** the reader chooses a category, **Then** they are taken to that category's page listing only its published posts, with a short description of the category.
5. **Given** a post's tag, **When** the reader selects it, **Then** they see all published posts with that tag.
6. **Given** a post body, **When** it is displayed, **Then** headings, lists, quotes, links, images with alternative text and embedded video links are shown in a readable layout, and long posts include a table of contents.
7. **Given** a post or listing page, **When** a search engine inspects it, **Then** it has its own readable address, a unique title and description, a canonical address, a share image and, for posts, article structured data including author, publish and update dates and image.

---

### User Story 2 - Write and publish posts (Priority: P1)

An editor writes a post in the admin area: title, body, excerpt, cover image, category, tags, author, and an SEO title and description. They save drafts, preview the post exactly as readers will see it, publish it, and later edit or unpublish it.

**Why this priority**: Without self-service publishing, "regularly published content" depends on a developer. It reuses the draft/publish workflow of feature 004.

**Independent Test**: Write a draft post, preview it (confirming it is not publicly reachable), publish it and confirm it appears on the blog, its category and tag pages and the sitemap within 5 minutes; unpublish it and confirm it disappears from all of them.

**Acceptance Scenarios**:

1. **Given** a signed-in editor or admin, **When** they create a post and save a draft, **Then** it is stored as "Draft" and is not reachable or listed anywhere public.
2. **Given** a draft, **When** the editor chooses "Preview", **Then** they see the post exactly as it will appear, marked as a preview and visible only to signed-in team members.
3. **Given** a draft missing a required item (title, body of at least 300 words, excerpt, cover image with alternative text, category, author, alternative text for every image in the body), **When** the editor tries to publish, **Then** publishing is refused and each problem is shown.
4. **Given** SEO title and description fields, **When** the editor types, **Then** character counters and a search-result preview are shown; if left empty, the post title and excerpt are used.
5. **Given** a complete draft, **When** the editor publishes it, **Then** within 5 minutes it appears on the blog, its category and tag pages, related posts elsewhere and the sitemap, with the publish date set to the moment of first publishing.
6. **Given** a published post, **When** the editor unpublishes it, **Then** within 5 minutes its address returns "not found" and it is removed from every list, related post section and the sitemap.
7. **Given** a published post whose address is changed, **When** the old address is visited, **Then** it permanently redirects to the new one.
8. **Given** the tag field, **When** the editor types, **Then** existing tags are suggested to avoid near-duplicates (for example, "karachi" and "Karachi" are the same tag).

---

### User Story 3 - Related posts and a next step (Priority: P2)

At the end of a post, the reader sees up to three related posts and a call to action relevant to the post's topic, inviting them to start a project, book a call or subscribe to the newsletter.

**Why this priority**: Turns readers into prospects and keeps them on the site, but posts deliver search value without it.

**Independent Test**: Open a post and confirm up to three related published posts (same category or shared tags) and a call to action linked to the post's category service are shown.

**Acceptance Scenarios**:

1. **Given** a published post, **When** the reader reaches the end, **Then** up to 3 other published posts are suggested, preferring shared tags, then the same category, then most recent.
2. **Given** a post in a category that matches a service, **When** the call to action is shown, **Then** it invites the reader to start a project for that service (inquiry form with that service pre-selected, feature 001) or book a discovery call (feature 006).
3. **Given** the end of any post, **When** it is shown, **Then** a newsletter signup is also offered.

---

### User Story 4 - Land on an industry page (Priority: P2)

A prospect searching for marketing for their industry in their city (for example, "restaurant marketing Karachi") lands on an industry page that speaks to their situation, shows the services most relevant to that industry and case studies from that industry, and invites them to get in touch.

**Why this priority**: Industry-and-city pages capture high-intent local searches that general service pages miss.

**Independent Test**: Publish an industry page for restaurants in Karachi linked to Food & Beverages case studies; confirm it appears at its own address with relevant services, matching published case studies and a call to action, and that unpublishing it removes it from public view and the sitemap.

**Acceptance Scenarios**:

1. **Given** a published industry page, **When** a prospect opens it, **Then** they see a headline naming the industry and location, the common challenges in that industry, the relevant services (linking to service pages, feature 006), relevant case studies, FAQs for that industry (if any) and a call to action.
2. **Given** an industry page linked to a case study industry, **When** case studies in that industry are published or unpublished, **Then** the page's case studies update within 5 minutes; editors may instead hand-pick up to 6 case studies.
3. **Given** an industry page with no published case studies, **When** it is viewed, **Then** the case study section is replaced by an invitation to book a call.
4. **Given** an editor, **When** they create, preview, publish, unpublish or edit an industry page, **Then** the shared publishing workflow applies (feature 004).
5. **Given** a published industry page, **When** a search engine inspects it, **Then** it has its own readable address (including industry and location), unique title and description, share image and structured data.

---

### User Story 5 - Subscribe to the newsletter (Priority: P2)

A reader enters their email in the newsletter signup, receives an email with a confirmation link, and is only subscribed once they click it. Every email from the agency includes a one-click unsubscribe link.

**Why this priority**: Builds an owned audience for future campaigns. Sending newsletters is out of scope; this collects and manages consenting subscribers.

**Independent Test**: Subscribe with an email, confirm the subscriber is "Pending" and not active; click the confirmation link and confirm they become "Confirmed"; use the unsubscribe link and confirm they become "Unsubscribed" without signing in.

**Acceptance Scenarios**:

1. **Given** the newsletter signup (footer, end of posts, blog home), **When** a reader enters a valid email and submits, **Then** they see "Check your inbox to confirm your subscription", and a confirmation email is sent.
2. **Given** a pending subscription, **When** the reader clicks the confirmation link within 7 days, **Then** the subscription becomes "Confirmed", they see a thank-you page, and the time of confirmation and the page they signed up on are recorded.
3. **Given** a pending subscription that is not confirmed within 7 days, **When** the link is used later, **Then** it is refused with an option to subscribe again; unconfirmed sign-ups are deleted after 30 days.
4. **Given** an email already confirmed, **When** it is submitted again, **Then** the reader sees the same "Check your inbox" message (without revealing that it is already subscribed) and no duplicate subscriber is created.
5. **Given** any email from the agency to a subscriber, **When** the subscriber uses the unsubscribe link, **Then** they are unsubscribed immediately without signing in and see a confirmation page with an option to re-subscribe.
6. **Given** the signup form, **When** it is shown, **Then** it states what readers will receive and links to the privacy policy.
7. **Given** automated or repeated signups, **When** they exceed the limits, **Then** they are rejected by the same bot protection and per-visitor limits used on the inquiry form (feature 001).

---

### User Story 6 - Apply for an open role (Priority: P2)

A job seeker views the agency's open roles, reads one, and applies with their name, email, phone, a CV in PDF and an optional note and portfolio link. They receive a confirmation, and only admins can see the application.

**Why this priority**: Attracting talent supports growth, and a proper application route replaces emailed CVs, which are hard to manage and a privacy risk.

**Independent Test**: Publish one open role and close another; confirm only the open one is listed and in the sitemap; apply with a valid PDF and confirm the applicant receives a confirmation and admins can see the application while editors cannot; try a Word file and an oversized PDF and confirm each is rejected.

**Acceptance Scenarios**:

1. **Given** the careers page, **When** a job seeker opens it, **Then** only published, open roles are listed with title, type (full-time, part-time, internship), work arrangement (on-site in Karachi, hybrid or remote) and closing date if set.
2. **Given** a role page, **When** it is viewed, **Then** it shows the description, responsibilities, requirements, what the agency offers and an application form, and has its own address, title, description, share image and job-posting structured data.
3. **Given** the application form, **When** the job seeker submits their name, a valid email, phone, a PDF CV of up to 5 MB and optionally a cover note (up to 1,500 characters) and a portfolio link, **Then** the application is stored, they see a confirmation, and they receive a confirmation email.
4. **Given** a CV that is not a real PDF (checked by the file's content, not its name) or is larger than 5 MB, **When** it is chosen, **Then** it is rejected with a clear message explaining the requirement and nothing is stored.
5. **Given** a new application, **When** it is stored, **Then** admins receive an email notification (without the CV attached), and the application and CV are visible only to admins in the admin area (feature 003).
6. **Given** a role that is closed, past its closing date or unpublished, **When** its address is visited, **Then** the role is not shown, the page says the role is no longer open and links to open roles, and it is removed from the careers list and sitemap.
7. **Given** no open roles, **When** the careers page is viewed, **Then** it says there are no open roles right now and invites job seekers to join the newsletter or check back.

---

### User Story 7 - Read the FAQ (Priority: P3)

A prospect reads a FAQ page that answers common questions about the agency's pricing approach, timelines and process, grouped by topic, without having to contact the agency.

**Why this priority**: Reduces repetitive questions and supports search, but most visitors convert through other pages.

**Independent Test**: Publish FAQs across groups and leave one as a draft; confirm the FAQ page shows only published questions, grouped, expandable by keyboard, with matching FAQ structured data.

**Acceptance Scenarios**:

1. **Given** the FAQ page, **When** it is opened, **Then** published questions are shown grouped by topic (including at least pricing approach, timelines and process), in the order editors set.
2. **Given** a question, **When** the prospect selects it (by mouse, touch or keyboard), **Then** its answer expands and screen readers announce the change.
3. **Given** the FAQ page, **When** a search engine inspects it, **Then** it has FAQ structured data matching the visible published questions.
4. **Given** an editor, **When** they create, edit, reorder, publish or unpublish a FAQ, **Then** the change appears on the FAQ page (and any service or industry page it is assigned to) within 5 minutes.
5. **Given** each FAQ, **When** it is stored, **Then** it is kept as a self-contained question and answer in plain, structured form with its topic, assigned services and industries, and publish status, so it can later be used as approved content by the AI chatbot.

---

### User Story 8 - Light and dark themes (Priority: P3)

A visitor whose device is set to dark mode sees the site in a dark theme automatically; a visitor who prefers the other look can switch manually, and the site remembers their choice.

**Why this priority**: Improves comfort and brand polish; it does not affect search or conversion directly.

**Independent Test**: Load the site with the device set to light and then dark and confirm the theme follows; switch manually and confirm the choice persists across pages and visits; run a contrast check on key pages in both themes.

**Acceptance Scenarios**:

1. **Given** a first-time visitor, **When** the site loads, **Then** it uses the device's light or dark setting, with no flash of the wrong theme.
2. **Given** the theme switch in the header (and mobile menu), **When** the visitor chooses Light, Dark or System, **Then** the site changes immediately and remembers the choice on that device for future visits.
3. **Given** either theme, **When** any page is checked, **Then** all text, icons, form fields, focus indicators and controls meet WCAG 2.1 AA contrast (4.5:1 for normal text, 3:1 for large text and interface elements).
4. **Given** logos, images, charts and share buttons, **When** viewed in either theme, **Then** they remain clearly visible.
5. **Given** a keyboard or screen-reader user, **When** they use the theme switch, **Then** it is reachable, labelled and announces the current theme.

---

### Edge Cases

- A category or tag has no published posts: its page shows a friendly message and links to the blog; tag pages with fewer than 2 published posts are not indexed or listed in the sitemap, to avoid thin pages.
- A post's author is unpublished as a team member: the post still shows the author's name and role, but without linking to the team page.
- A post links to another post that is later unpublished: the link leads to a "not found" page with links to the blog; editors can see broken internal links highlighted in preview.
- Two posts or industry pages would have the same address: the editor is asked to choose a different one.
- Very long titles or tags: they wrap cleanly on a 360-pixel-wide screen.
- A subscriber clicks the confirmation link twice: the second click shows the same thank-you page without error.
- A job seeker's upload fails part-way: the form keeps their other details and offers a retry.
- A CV containing active content or disguised as a PDF: it is rejected by the content check; CVs are never opened automatically in a way that could run embedded content.
- A role's closing date passes while a job seeker is filling in the form: submission is refused with a clear message.
- The visitor's device blocks storage of the theme choice: the site follows the device setting and the manual choice lasts for the visit only.
- Editors and admins in the admin area: the admin area also supports both themes with the same contrast requirements.

## Requirements *(mandatory)*

### Functional Requirements

**Blog posts (public)**

- **FR-001**: The blog MUST list published posts newest first, 12 per page with numbered, crawlable pages; each card shows cover image, title, excerpt, category, publish date and reading time.
- **FR-002**: Each post MUST show title, cover image, author (name, role, photo), publish date, last-updated date (if updated after publishing), reading time (words ÷ 200, rounded up, minimum 1 minute), category, tags and body; posts with 4 or more headings MUST include a table of contents.
- **FR-003**: Each category and tag MUST have its own page listing its published posts; categories correspond to the agency's five services (Social Media, SEO, Web & Software, UI/UX Design, Meta Ads) plus "Agency news".
- **FR-004**: Each post, category page and blog home MUST have a unique title and description, canonical address, share image (the cover image, or a generated branded image) and breadcrumbs; posts MUST have article structured data (headline, author, publish and update dates, image, publisher).
- **FR-005**: The end of each post MUST show up to 3 related published posts (shared tags first, then same category, then most recent), a call to action for the related service (inquiry or discovery call) and a newsletter signup.

**Blog posts (editing)**

- **FR-006**: Editors and admins MUST be able to create, edit, preview, publish, unpublish and delete posts using the shared workflow of feature 004 (including activity recording, 5-minute update time and image rules).
- **FR-007**: Each post MUST have: title, readable address (suggested from the title, unique), excerpt (up to 200 characters), body, cover image with alternative text, category, tags (0–8), author (a team member from feature 004), and optional SEO title (up to 60 characters) and SEO description (up to 160 characters), which default to the title and excerpt.
- **FR-008**: The post body MUST support headings, paragraphs, bold/italic, lists, quotes, links, images (with alternative text and optional caption) and embedded video links (YouTube, Vimeo, Instagram, loaded only when played); any other markup MUST be removed.
- **FR-009**: Publishing MUST be refused unless the post has a title, a body of at least 300 words, an excerpt, a cover image with alternative text, a category, an author, and alternative text for every image in the body.
- **FR-010**: Preview MUST show the post exactly as it will appear publicly, including a search-result preview of the SEO title and description, available only to signed-in team members and never indexed.
- **FR-011**: The publish date MUST be set on first publishing; changing a published post's address MUST create a permanent redirect from the old address.
- **FR-012**: Tags MUST be matched regardless of capitalisation and spacing, with existing tags suggested while typing.

**Industry pages**

- **FR-013**: Editors MUST be able to create, preview, publish, unpublish and edit industry pages using the shared workflow; each page has industry name, location (city and country), readable address including both, headline, introduction, common challenges, relevant services (from the five), related case studies (automatically from one or more case study industries, or up to 6 hand-picked), optional assigned FAQs, SEO title and description and share image.
- **FR-014**: Published industry pages MUST show their related published case studies, updating within 5 minutes of case studies being published or unpublished, and replace the section with a call to action when there are none.
- **FR-015**: Each industry page MUST have a unique title and description, canonical address, share image and structured data describing the page and the services offered for that industry and location, plus breadcrumbs.

**Newsletter**

- **FR-016**: The newsletter signup MUST collect an email address only, state what subscribers will receive, link to the privacy policy, and be offered in the footer, on the blog home and at the end of posts.
- **FR-017**: New subscriptions MUST be "Pending" until the email owner uses the confirmation link; only "Confirmed" subscribers are active. Confirmation links MUST be single-purpose and expire after 7 days; unconfirmed sign-ups MUST be deleted after 30 days.
- **FR-018**: The on-screen response to a signup MUST be the same whether the email is new, pending or already confirmed; no duplicate subscribers may be created.
- **FR-019**: Subscribers MUST be able to unsubscribe at any time using a link in every email, without signing in, taking effect immediately.
- **FR-020**: The system MUST record, for each subscriber, the signup time, confirmation time, source page and unsubscribe time, and MUST make subscriber data visible only to admins (feature 003).
- **FR-021**: Signups MUST use the same bot protection and per-visitor limits as the inquiry form (feature 001), and confirmation emails to the same address MUST be limited to 3 per day.

**FAQ**

- **FR-022**: The FAQ page MUST show published FAQs grouped by topic (at least: Working with us, Pricing approach, Timelines, Process, Services), in editor-set order, as expandable questions operable by mouse, touch and keyboard, with FAQ structured data matching the visible content.
- **FR-023**: Each FAQ MUST be stored as a self-contained question and plain-text answer (with limited formatting: links, lists, bold), with its topic, assigned services and industries, publish status and last-updated date, so it can be reused on service pages (feature 006), industry pages and by the future AI chatbot as approved content.
- **FR-024**: Editors and admins MUST be able to create, edit, reorder, publish, unpublish and delete FAQs using the shared workflow.

**Careers**

- **FR-025**: Editors and admins MUST be able to create, preview, publish, unpublish, edit and close roles, each with title, readable address, type (full-time, part-time, internship), work arrangement (on-site Karachi, hybrid, remote), description, responsibilities, requirements, what the agency offers, and optional closing date.
- **FR-026**: Only published roles that are open and not past their closing date MUST be listed on the careers page, have job-posting structured data and appear in the sitemap; other role addresses MUST show a "no longer open" message with links to open roles and MUST NOT be indexed.
- **FR-027**: The application form MUST collect name (required), email (required, valid), phone (required), CV (required, PDF only, verified by content, up to 5 MB), cover note (optional, up to 1,500 characters) and portfolio link (optional, valid web address), with inline errors and keyboard and screen-reader support.
- **FR-028**: Each application MUST be stored against its role with the submission time and status "New"; the applicant MUST see an on-screen confirmation and receive a confirmation email; admins MUST receive a notification email without the CV attached.
- **FR-029**: Applications and CVs MUST be stored privately and be viewable and downloadable only by admins (feature 003); CVs MUST NOT be reachable through any public address.
- **FR-030**: Applications MUST use the same bot protection and per-visitor limits as the inquiry form, and be limited to one application per email address per role.

**Theme**

- **FR-031**: The public site and the admin area MUST offer light and dark themes, following the device setting by default, with a manual switch (Light, Dark, System) in the header and mobile menu that is remembered on the device and applied without a flash of the wrong theme.
- **FR-032**: Both themes MUST meet WCAG 2.1 AA contrast for text (4.5:1, or 3:1 for large text) and for interface elements and focus indicators (3:1).

**Visibility, sitemap and measurement**

- **FR-033**: Only published posts, published industry pages and open roles MUST appear publicly and in the sitemap; drafts, unpublished and closed items MUST return "not found" (or, for roles, the "no longer open" page) and never appear in lists, related sections or structured data.
- **FR-034**: The system MUST record events for post views, category and tag filter use, end-of-post call-to-action clicks, newsletter signups and confirmations, role views and application submissions, without personal data (feature 002).

### Key Entities

- **Post**: A blog article. Title, address, excerpt, body, cover image, category, tags, author, SEO title and description, reading time, status, publish date, last-updated date, previous addresses (for redirects).
- **Category**: One of the five services or "Agency news", with a name, address and description.
- **Tag**: A free-form topic label, unique regardless of capitalisation, with its own address.
- **Author**: A team member (feature 004) credited on posts.
- **Industry page**: An industry-and-location landing page. Industry name, location, address, content sections, relevant services, case study selection (by industry or hand-picked), assigned FAQs, SEO fields, status.
- **Subscriber**: An email address with status (Pending, Confirmed, Unsubscribed), signup, confirmation and unsubscribe times and source page. Admin-only.
- **FAQ**: Question, answer, topic, assigned services and industries, order, status, last updated. Reusable by the chatbot.
- **Role**: An open position. Title, address, type, work arrangement, description sections, closing date, status (Draft, Published, Closed).
- **Application**: A job seeker's application to one role. Name, email, phone, CV (PDF), cover note, portfolio link, submission time, status. Admin-only.
- **Theme preference**: The visitor's Light, Dark or System choice, remembered on their device only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of published posts, industry pages and open roles have a unique title, description and share image, and valid structured data with 0 errors in rich-results validation.
- **SC-002**: 0 drafts, unpublished posts or industry pages, or closed roles appear in public lists, related sections or the sitemap.
- **SC-003**: An editor can write and publish a post with a cover image in under 15 minutes once the text is ready, without a developer.
- **SC-004**: 100% of active newsletter subscribers have a recorded confirmation; 0 subscribers are active without confirming.
- **SC-005**: 100% of non-PDF and over-5 MB CV uploads are rejected with a clear message; 0 applications or CVs are accessible to editors or the public.
- **SC-006**: A job seeker can find a role and apply on a phone in under 5 minutes.
- **SC-007**: Key pages in both themes pass an automated WCAG 2.1 AA contrast check with 0 failures.
- **SC-008**: Blog posts and industry pages score 90 or above for SEO and Accessibility in a mobile Lighthouse audit and meet the site's mobile performance targets (feature 002).
- **SC-009**: Within 6 months of regular publishing, organic search visits to the site grow by at least 50% compared with the month before launch.
- **SC-010**: Within 3 months, at least 5% of blog readers who reach the end of a post click the call to action or subscribe.

## Assumptions

- **Depends on** features 001 (inquiry form, bot protection and limits), 002 (SEO rules, share images, structured data, analytics, privacy policy), 003 (admin access; applicants and subscribers are admin-only), 004 (publishing workflow, image rules, team members as authors), 005 (case studies) and 006 (service pages).
- **Existing prototypes**: The site already has blog, category, tag, industry, careers, FAQ, newsletter and theme prototypes with sample data. This feature defines the complete behaviour they must meet. The existing blog categories (SEO, Social Media, Meta Ads, Web Development) are replaced by the five services plus "Agency news" so posts line up with service pages.
- **Industry pages** were out of scope in feature 006 and are in scope here. Existing sample pages (restaurants in Karachi, real estate in Dubai, clinics in the UK) become editor-managed industry pages. Because industries such as real estate are not in the case study industry list, each industry page chooses which case study industries feed it, or hand-picks case studies.
- **Structured data for industry pages**: The brief asks for article structured data on industry pages. Industry pages are landing pages rather than articles, and marking them as articles can be ignored or treated as misleading by search engines, so they use structured data describing the page and the services offered instead. Posts use article structured data as requested. Revisit with `/speckit-clarify` if article markup is required.
- **Newsletter**: Sending newsletters is out of scope; the unsubscribe link applies to confirmation emails now and to future newsletters.
- **Careers limits**: CVs are PDF only up to 5 MB (matching the existing form). The retention period for applications will be stated in the privacy policy alongside the inquiry retention period still to be decided in feature 002.
- **Theme preference** is stored only on the visitor's device and is not personal data.
- **Language**: English only.
- **Out of scope**: Comments, sending newsletters, multi-language content, scheduled publishing, version history, RSS feeds, site-wide search, application status updates to candidates, and a candidate account area.
