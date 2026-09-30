# Feature Specification: Case Studies

**Feature Branch**: `005-case-studies`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Show The Buzz Crew's results through detailed case studies. The site currently shows only client logos, so prospects cannot see what the agency achieved. Each case study includes: client name, industry (Food & Beverages, Farmhouses, Healthcare & Dental, Education, E-commerce, Other), country, services delivered, the challenge, the strategy, the execution, measurable results, images and video reels, an optional before/after comparison, and an optional linked testimonial. [...] Out of scope: client-submitted case studies, comments."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a case study that proves results (Priority: P1)

A prospect, often arriving from a shared link or an ad, opens a case study and quickly understands who the client was, what problem they had, what the agency did, and which numbers improved. Headline results are visible near the top without scrolling far, and the full story (challenge, strategy, execution) follows with images and video reels.

**Why this priority**: This is the reason for the feature. A single well-presented case study already gives prospects evidence the agency delivers, even before browsing and filtering exist.

**Independent Test**: Publish one case study and open its page on a phone; confirm the client, industry, country, services and at least one headline result are visible on the first screen, and the challenge, strategy, execution, results and media follow in that order.

**Acceptance Scenarios**:

1. **Given** a published case study, **When** a prospect opens its page, **Then** they see the client name, industry, country, services delivered and the headline result metrics before the detailed story.
2. **Given** a published case study, **When** the prospect reads on, **Then** the page presents, in order, the challenge, the strategy, the execution and the results, each clearly headed.
3. **Given** a result metric, **When** it is displayed, **Then** it shows the value, what it measures and the time period (for example, "+240% Instagram reach in 3 months"), and, where given, the starting value it improved from.
4. **Given** a case study with video reels, **When** the page loads, **Then** each reel shows a preview image and plays only when the prospect chooses to play it, without slowing the page's initial load.
5. **Given** a case study with a linked testimonial, **When** the page is viewed, **Then** the client's quote, name, role and company are shown alongside the results.
6. **Given** a case study page, **When** it is shared or found by search engines, **Then** it has its own readable address, a unique title and description, and a share image (from feature 002's standards).

---

### User Story 2 - Start an inquiry from a case study (Priority: P1)

A prospect who has just read a relevant case study sees an invitation to start a similar project and opens the inquiry form without leaving the page. The team can see which case study the inquiry came from.

**Why this priority**: Case studies exist to convert. Without a direct next step, persuaded prospects leave.

**Independent Test**: From a case study page, start and submit an inquiry and confirm the resulting lead records the case study as its source and that the services delivered in the case study were pre-selected.

**Acceptance Scenarios**:

1. **Given** a prospect at the end of a case study (and in a persistent call to action while reading), **When** they choose "Start a similar project", **Then** the inquiry form from feature 001 opens on the page.
2. **Given** the inquiry form opened from a case study, **When** it appears, **Then** the services delivered in that case study are pre-selected, and the prospect can change them.
3. **Given** an inquiry submitted from a case study, **When** it is stored, **Then** the lead records the case study page it came from.
4. **Given** a prospect who prefers messaging, **When** they finish the case study, **Then** a WhatsApp option is also offered.

---

### User Story 3 - Editors create, preview and publish case studies (Priority: P1)

An editor builds a case study in the admin area: client details, industry, country, services, the challenge, strategy, execution, result metrics, images, video reels, an optional before/after comparison and an optional linked testimonial. They save drafts, preview exactly how the page will look, publish it when ready and unpublish it if the client asks.

**Why this priority**: Without it, case studies require a developer. It reuses the draft/publish workflow from feature 004.

**Independent Test**: Create a case study, preview it as a draft (confirming it is not publicly reachable), try to publish with no result metric (refused), add a metric and publish, then unpublish and confirm it disappears everywhere public.

**Acceptance Scenarios**:

1. **Given** a signed-in editor or admin, **When** they create a case study and save it as a draft, **Then** it is stored with status "Draft" and is not reachable or listed anywhere public.
2. **Given** a draft, **When** the editor chooses "Preview", **Then** they see the page exactly as a prospect would, clearly marked as a preview, available only to signed-in team members.
3. **Given** a case study with no result metric, **When** the editor tries to publish, **Then** publishing is refused with the message "Add at least one result before publishing".
4. **Given** a case study missing any other publishing requirement (see FR-015), **When** the editor tries to publish, **Then** each missing item is shown next to its field and the case study stays a draft.
5. **Given** a complete draft, **When** the editor publishes it, **Then** it appears on its own page, in the case study list and in the sitemap within 5 minutes.
6. **Given** a published case study, **When** the editor unpublishes it, **Then** within 5 minutes its page returns "not found" and it is removed from the list, filters, related case studies, the sitemap and every other public place.
7. **Given** a published case study, **When** the editor changes its address, **Then** the previous address permanently redirects to the new one.
8. **Given** the editor links a testimonial, **When** they choose it, **Then** they can pick only from existing testimonials (feature 004), and only a published testimonial is shown on the public page.

---

### User Story 4 - Browse and filter case studies (Priority: P2)

A prospect opens the "Work" section and sees all published case studies as cards showing the client, industry, a key result and an image. They narrow the list by industry and by service to find work similar to their own business.

**Why this priority**: Browsing matters once there are several case studies; with only a few, individual pages and links from the home page carry most of the value.

**Independent Test**: With case studies across several industries and services, filter by one industry, then by one service, then both together; confirm only matching case studies appear and counts are correct.

**Acceptance Scenarios**:

1. **Given** the case study list, **When** a prospect opens it, **Then** every published case study is shown as a card with client name, industry, country, a headline result and a cover image, in the order set by the editors.
2. **Given** the list, **When** the prospect chooses an industry, **Then** only case studies in that industry are shown.
3. **Given** the list, **When** the prospect chooses a service, **Then** only case studies that delivered that service are shown.
4. **Given** both an industry and a service are chosen, **When** the list updates, **Then** only case studies matching both are shown.
5. **Given** a filter combination with no matching case studies, **When** it is applied, **Then** a friendly message is shown with a way to clear the filters and an invitation to start an inquiry.
6. **Given** filter options, **When** they are shown, **Then** only industries and services that have at least one published case study are offered, each with a count.
7. **Given** more than 12 matching case studies, **When** the list is shown, **Then** the first 12 appear with a way to show more.

---

### User Story 5 - Share a filtered view or a single case study (Priority: P2)

A prospect filters the list to "Healthcare & Dental" and "SEO" and sends the link to a colleague, or shares one case study on WhatsApp. The recipient opens the link and sees exactly the same filtered list or case study.

**Why this priority**: Decisions in client businesses are often made by several people; shareable links carry the agency's proof to them.

**Independent Test**: Apply filters, copy the address from the browser, open it in a new private window and confirm the same filters and results are shown; share a case study link and confirm the preview and page match.

**Acceptance Scenarios**:

1. **Given** a prospect applies filters, **When** the list updates, **Then** the page address changes to reflect the chosen filters without reloading the page.
2. **Given** a filtered address, **When** someone else opens it, **Then** the same filters are applied and the same case studies are shown.
3. **Given** a filtered view, **When** the prospect uses the browser's back button, **Then** they return to the previous filter state.
4. **Given** a filtered address with an unknown or misspelled filter value, **When** it is opened, **Then** the unknown filter is ignored and the list still loads.
5. **Given** a case study page or filtered view is shared on WhatsApp, LinkedIn or Facebook, **When** the preview appears, **Then** it shows a relevant title, description and image.
6. **Given** a case study page, **When** the prospect wants to share it, **Then** they can use a share option (the device's share menu on phones, or copy link), with confirmation when the link is copied.

---

### User Story 6 - Compare before and after (Priority: P3)

A prospect viewing a redesign project (for example, a website or brand refresh) drags a slider across a pair of images to reveal the "before" and "after" versions.

**Why this priority**: A strong visual for redesign work, but only relevant to some case studies.

**Independent Test**: Open a case study with a before/after comparison and operate the slider by mouse drag, touch drag and keyboard; confirm each reveals more of one image and less of the other, and that a screen reader announces both images and the slider's position.

**Acceptance Scenarios**:

1. **Given** a case study with a before/after comparison, **When** the prospect drags the slider handle with a mouse or finger, **Then** the dividing line follows and reveals more of the "before" or "after" image, with each side clearly labelled.
2. **Given** a keyboard user, **When** they move focus to the slider, **Then** it shows a visible focus state, the arrow keys move it in small steps, Page Up/Page Down in larger steps, and Home/End move to either end.
3. **Given** a screen-reader user, **When** they reach the comparison, **Then** it is announced as a before/after comparison with its current position, and both images' descriptions are available.
4. **Given** a phone, **When** the prospect drags the slider horizontally, **Then** the page does not scroll sideways, and vertical scrolling over the image still scrolls the page.
5. **Given** the prospect prefers reduced motion, **When** the comparison loads, **Then** it does not animate on its own.

---

### User Story 7 - Discover related work (Priority: P3)

At the end of a case study, the prospect sees up to three related case studies (same industry or services) to continue exploring.

**Why this priority**: Improves engagement but is not needed for the core proof.

**Independent Test**: With several case studies, open one and confirm up to three others sharing its industry or services are suggested, never including unpublished ones or the current one.

**Acceptance Scenarios**:

1. **Given** a case study page, **When** related work is shown, **Then** up to three other published case studies are suggested, preferring the same industry, then shared services.
2. **Given** no other published case studies are related, **When** the page loads, **Then** the related section is hidden.

---

### Edge Cases

- The case study list has no published case studies: the Work page shows a friendly message and an inquiry invitation instead of an empty grid, and is not advertised in navigation as empty.
- A case study's linked testimonial is unpublished or deleted: the case study still displays, without the testimonial.
- A video reel's source is removed or unavailable: the page shows the preview image with a message, or hides the reel, rather than a broken player.
- An image in the before/after pair has different dimensions from the other: both are displayed at the same size so the comparison lines up, and the editor is warned during preview.
- Very large numbers or long metric labels: result metrics wrap cleanly on a 360-pixel-wide phone screen.
- A client asks for their case study to be removed: unpublishing removes it from every public place within 5 minutes.
- Two case studies would have the same address: the editor is asked to choose a different one.
- A prospect opens an unpublished case study's address: they see "not found", with no hint that a draft exists.
- A preview link is shared outside the team: anyone not signed in is sent to sign-in and sees nothing.
- Filtering on a slow connection: the list shows a loading state and previous results remain visible until the new ones are ready.

## Requirements *(mandatory)*

### Functional Requirements

**Case study content**

- **FR-001**: Each case study MUST include: client name (as it should appear publicly), project title, short summary (for cards and share previews), industry (one of Food & Beverages, Farmhouses, Healthcare & Dental, Education, E-commerce, Other), country (Pakistan, UAE, UK, Other), services delivered (one or more of Social Media, SEO, Web & Software, UI/UX Design, Meta Ads), challenge, strategy, execution, result metrics, a cover image and a readable address.
- **FR-002**: Each case study MAY include: additional images (up to 20), video reels (up to 5), one before/after comparison, one linked testimonial, and the project period (for example, "Jan–Jun 2026").
- **FR-003**: Each result metric MUST have a value, a description of what was measured and a time period, and MAY have a starting value; a case study MUST have between 1 and 6 metrics, and editors choose which (up to 3) are headline metrics shown first and on cards.
- **FR-004**: The challenge, strategy and execution sections MUST support paragraphs, headings, bulleted lists, bold/italic text and links; any other markup MUST be removed.
- **FR-005**: Video reels MUST be added as links to YouTube, Vimeo or Instagram, each with a preview image and a text description; reels MUST NOT load third-party content until the prospect chooses to play them.
- **FR-006**: A before/after comparison MUST consist of two images with alternative text and labels (defaulting to "Before" and "After").
- **FR-007**: All images MUST follow the upload, preview, size, format and alternative-text rules of feature 004.

**Case study page**

- **FR-008**: Each published case study MUST have its own permanent, readable address in the Work section, a unique title and description, a canonical address, a share image (the cover image, or a generated branded image), and structured data describing it as a piece of creative work (per feature 002).
- **FR-009**: The page MUST show client, industry, country, services and headline metrics before the detailed story, followed by the challenge, strategy, execution, all results, media, testimonial (if any) and related case studies.
- **FR-010**: The page MUST offer a "Start a similar project" call to action at the end of the story and a persistent, unobtrusive call to action while reading; both open the inquiry form (feature 001) with the case study's services pre-selected and the case study recorded as the lead's source.
- **FR-011**: The page MUST offer a way to share it (the device's share menu where available, otherwise copy link with confirmation, plus WhatsApp and LinkedIn).
- **FR-012**: When a published case study's address changes, the old address MUST permanently redirect to the new one.

**Before/after slider**

- **FR-013**: The before/after comparison MUST be operable by mouse drag, touch drag and keyboard (arrow keys for small steps, Page Up/Page Down for large steps, Home/End for the ends), start at the midpoint, have a visible focus state, announce its position to screen readers, and not interfere with vertical page scrolling on touch devices.

**Editing and publishing**

- **FR-014**: Editors and admins MUST be able to create, edit, preview, publish, unpublish, reorder and delete case studies using the shared draft/publish workflow of feature 004, including its activity recording and 5-minute update time.
- **FR-015**: Publishing MUST be refused unless the case study has all required fields from FR-001, at least one result metric, alternative text for every image, and a text description for every video reel; each problem MUST be shown next to its field.
- **FR-016**: Preview MUST show the draft exactly as it will appear publicly, be clearly marked as a preview, be available only to signed-in team members and never be indexed.
- **FR-017**: Case study addresses MUST be unique; the system MUST suggest one from the client name and project title and refuse duplicates.
- **FR-018**: Editors MUST be able to link a case study to one existing testimonial; only a published testimonial is shown publicly.

**Visibility**

- **FR-019**: Unpublished (draft) case studies MUST NOT be reachable, listed or referenced anywhere public: their address returns "not found", and they are excluded from the case study list, filter counts, related case studies, the sitemap, structured data, share previews and any site search.

**Browsing, filtering and sharing**

- **FR-020**: The Work section MUST list all published case studies as cards (cover image, client, industry, country, up to 3 headline metrics) in editor-set order, showing 12 at a time with a way to load more.
- **FR-021**: Prospects MUST be able to filter by one industry and/or one service; when both are chosen, only case studies matching both are shown. Only options with at least one published case study are offered, each with a count.
- **FR-022**: The current filters MUST be reflected in the page address so that opening, sharing, bookmarking and using back/forward reproduces the same view; unknown filter values MUST be ignored.
- **FR-023**: Filtered views MUST remain crawlable only in their unfiltered form: the canonical address of any filtered view is the unfiltered Work page, so filtered views do not compete in search results.
- **FR-024**: Filter controls and results MUST be usable with a keyboard and screen reader, and the number of results MUST be announced when filters change.
- **FR-025**: Each case study page MUST suggest up to 3 related published case studies, preferring the same industry, then shared services, and hide the section when there are none.

**Measurement**

- **FR-026**: The system MUST record case study page views, filter use (which filter, not who) and "Start a similar project" clicks as events, without personal data (per feature 002).

### Key Entities

- **Case study**: A published account of a client project. Client name, project title, summary, address, industry, country, services, challenge, strategy, execution, project period, cover image, display order, status (Draft/Published) and publishing history (shared workflow from feature 004).
- **Result metric**: One measurable outcome of a case study: value, what was measured, time period, optional starting value, and whether it is a headline metric. Belongs to one case study (1–6 per case study).
- **Media item**: An image or video reel belonging to a case study, in a set order, with alternative text or description; video reels also have a source link and preview image.
- **Before/after comparison**: A pair of images with labels and alternative text; at most one per case study.
- **Testimonial** (from feature 004): Optionally linked to a case study.
- **Industry** and **Service**: Fixed lists used for classification and filtering; services are the same five used in the inquiry form.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A prospect can identify a case study's client, industry and headline result within 5 seconds of the page loading on a phone.
- **SC-002**: A prospect can find a case study relevant to their industry within 3 interactions from the Work page.
- **SC-003**: 100% of shared filtered views and case study links reproduce the same content for the recipient.
- **SC-004**: 0 unpublished case studies are reachable, listed or referenced anywhere public.
- **SC-005**: 100% of published case studies have at least one result metric, a unique title, description and share image.
- **SC-006**: The before/after slider can be fully operated by mouse, touch and keyboard alone, and passes a screen-reader walkthrough.
- **SC-007**: Case study pages score 90 or above for SEO and Accessibility in a mobile Lighthouse audit and meet the site's mobile performance targets (feature 002), including pages with video reels.
- **SC-008**: An editor can create and publish a complete case study in under 30 minutes, once they have the content ready.
- **SC-009**: Within 3 months of launch, at least 10% of inquiries come from case study pages (measured through the lead source).

## Assumptions

- **Depends on** feature 001 (inquiry form), feature 002 (page titles, share images, structured data, sitemap, analytics), feature 003 (admin sign-in and roles) and feature 004 (publishing workflow, image rules, testimonials).
- **Location**: Case studies live in the site's "Work" section (already in the site navigation), each at its own readable address.
- **Industry lists**: The case study industries (Food & Beverages, Farmhouses, Healthcare & Dental, Education, E-commerce, Other) are a fixed list for this feature. The existing industry landing pages (Restaurants, Real estate, Private clinics) have their own "Related case studies" section; linking those cards to real case studies is a small follow-up once case studies exist and is not required here.
- **Filtering** allows one industry and one service at a time, which keeps shared links simple; multi-select filters can be added later.
- **Video reels** are linked from YouTube, Vimeo or Instagram rather than uploaded, to keep pages fast and avoid storing large video files.
- **Ordering**: Editors set the order of the case study list (with newest first as the default position for new items).
- **Client permission**: Editors are responsible for having the client's permission to publish names, figures and images; results should be real and verifiable. The system does not track consent.
- **Language**: English only.
- **Out of scope**: Client-submitted case studies, comments, downloadable PDF versions, site-wide search, multi-select filters, and password-protected case studies for private sharing.
