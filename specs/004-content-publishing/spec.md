# Feature Specification: Content Management and Publishing

**Feature Branch**: `004-content-publishing`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Let The Buzz Crew team update website content without a developer. Content types managed here: testimonials, client logos, and team members. Later features (case studies, blog posts) will reuse the same publishing workflow. [...] Out of scope: case studies and blog posts (their own features), version history, scheduled publishing."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Draft and publish a testimonial (Priority: P1)

An editor receives a quote from a happy client. In the admin area they create a testimonial with the client's name, role, company, country, the quote, a photo and optionally a link to a video version. They save it as a draft, come back later to check it, then publish it. Within a few minutes it appears in the testimonials section of the website. If the client later asks for it to be removed, the editor unpublishes it and it disappears from the site.

**Why this priority**: Testimonials are the strongest social proof on the home page and change most often. This story also establishes the draft → publish → unpublish workflow that every other content type (and later case studies and blog posts) reuses.

**Independent Test**: Create a testimonial, save it as a draft and confirm it does not appear on the website; publish it and confirm it appears within 5 minutes; unpublish it and confirm it disappears within 5 minutes, all without a new deployment.

**Acceptance Scenarios**:

1. **Given** a signed-in editor or admin, **When** they create a testimonial with at least a name and quote and choose "Save draft", **Then** it is saved with status "Draft" and does not appear on the public website.
2. **Given** a draft testimonial that has all required fields and alternative text for its photo, **When** the editor chooses "Publish", **Then** its status becomes "Published" and it appears on the website within 5 minutes.
3. **Given** a draft testimonial that is missing a required field or photo alternative text, **When** the editor tries to publish it, **Then** publishing is refused, each missing item is shown next to its field, and the item stays a draft.
4. **Given** a published testimonial, **When** the editor chooses "Unpublish", **Then** its status becomes "Draft" and it disappears from the website within 5 minutes, while remaining available in the admin area.
5. **Given** a published testimonial, **When** the editor edits it and saves, **Then** the changes must pass the same checks as publishing and then appear on the website within 5 minutes.
6. **Given** a testimonial with a video link, **When** it is shown on the website, **Then** visitors see a clearly labelled link to watch the video, which opens in a new tab.
7. **Given** an editor enters a video link that is not a valid YouTube, Vimeo or Instagram address, **When** they save, **Then** an inline error explains which links are accepted.

---

### User Story 2 - Upload images with preview and alternative text (Priority: P1)

When adding a photo or logo, the editor chooses an image from their computer or phone, sees a preview of exactly how it will look before saving, and writes a short description of the image (alternative text) for visitors using screen readers. Files that are not images, or that are too large, are rejected immediately with a clear explanation.

**Why this priority**: Every content type depends on images. Getting uploads, previews and alternative text right once serves testimonials, logos, team members and future content.

**Independent Test**: Upload a valid photo and confirm a preview appears before saving; try a PDF and an oversized image and confirm each is rejected with a clear message; try to publish without alternative text and confirm it is refused.

**Acceptance Scenarios**:

1. **Given** an editor on a content form, **When** they choose a JPEG, PNG or WebP image under 5 MB, **Then** a preview appears showing how it will be cropped and displayed on the website, before anything is saved.
2. **Given** an editor chooses a file that is not a JPEG, PNG or WebP image (for example, a PDF, a video or a renamed file that is not really an image), **When** the upload is checked, **Then** it is rejected with the message "Please choose a JPEG, PNG or WebP image" and nothing is stored.
3. **Given** an editor chooses an image larger than 5 MB, **When** the upload is checked, **Then** it is rejected with a message stating the file size and the 5 MB limit, and nothing is stored.
4. **Given** an image smaller than the minimum size for its use (400 × 400 pixels for photos, 200 pixels wide for logos), **When** it is chosen, **Then** the editor is told it will look blurry and asked to choose a larger one.
5. **Given** an item with an image but no alternative text, **When** the editor tries to publish, **Then** publishing is refused with a message asking for a description of the image; saving as a draft is still allowed.
6. **Given** alternative text that only repeats the file name or is shorter than 5 characters, **When** the editor tries to publish, **Then** they are asked to describe what the image shows.
7. **Given** an editor replaces an existing image, **When** they save, **Then** the new image is shown on the website (if published) and the old one is no longer shown anywhere.
8. **Given** an upload fails part-way (for example, poor connection), **When** it happens, **Then** the editor sees an error with a retry option and the rest of the form is kept.

---

### User Story 3 - Manage client logos (Priority: P2)

An editor adds the logo of a newly signed client, sets where it appears in the row of client logos, and removes the logo of a former client. The website's client logo strip reflects the change within a few minutes.

**Why this priority**: Client logos build trust quickly but change less often than testimonials.

**Independent Test**: Add and publish a logo, move it to the first position and confirm the website shows it first; remove a logo and confirm it disappears from the website.

**Acceptance Scenarios**:

1. **Given** a signed-in editor, **When** they add a client logo with the client's name, logo image, alternative text and optional website address, and publish it, **Then** it appears in the website's client logo strip within 5 minutes.
2. **Given** several published logos, **When** the editor changes their order (by dragging or with "Move up/Move down" controls) and saves, **Then** the website shows them in the new order within 5 minutes.
3. **Given** a logo, **When** the editor chooses "Remove" and confirms, **Then** it is permanently deleted and no longer appears in the admin area or on the website.
4. **Given** a logo with a website address, **When** a visitor selects it on the website, **Then** the client's site opens in a new tab.

---

### User Story 4 - Manage team members (Priority: P2)

An editor adds a new team member with their name, role, photo and short bio, orders the team so the founders appear first, updates details when someone changes role, and unpublishes or removes a member who leaves.

**Why this priority**: Showing real people builds trust, but team changes are infrequent.

**Independent Test**: Add a team member, publish them and confirm they appear wherever the website shows the team; reorder and confirm the order; unpublish and confirm they disappear.

**Acceptance Scenarios**:

1. **Given** a signed-in editor, **When** they add a team member with name, role, photo with alternative text and a bio of up to 300 characters, and publish, **Then** the team member appears on the website's team section within 5 minutes.
2. **Given** a bio longer than 300 characters, **When** the editor types, **Then** a character counter shows the limit and saving is refused with a clear message until it is shortened.
3. **Given** several team members, **When** the editor changes their order, **Then** the website shows them in the new order.
4. **Given** a team member who has left, **When** the editor unpublishes or removes them, **Then** they no longer appear on the website within 5 minutes.

---

### User Story 5 - Find and keep track of content (Priority: P3)

An editor opening the content area sees, for each content type, a list of items with their status (Draft or Published), a thumbnail, and who last changed them and when, so they can quickly find drafts waiting to be published.

**Why this priority**: Useful once there are more than a handful of items; the core workflow works without it.

**Independent Test**: With a mix of draft and published items, open each content list and confirm status, thumbnail and last-changed details are shown and drafts can be filtered.

**Acceptance Scenarios**:

1. **Given** a content list, **When** it is opened, **Then** each item shows its name, thumbnail, status, and the name of the person who last changed it and when.
2. **Given** a content list, **When** the editor filters by "Draft" or "Published", **Then** only matching items are shown.
3. **Given** an editor has unsaved changes on a form, **When** they try to leave the page, **Then** they are warned before losing them.

---

### Edge Cases

- Two team members edit the same item at the same time: when the second saves, they are told the item was changed by someone else since they opened it and can review before overwriting.
- A published item is deleted: it disappears from the website; deletion always asks for confirmation and states that it cannot be undone.
- A published content type has no published items (for example, every testimonial unpublished): the corresponding website section is hidden rather than shown empty.
- An editor's session expires while filling in a form: after signing in again, they are returned to the form, and unsaved changes are not silently lost without warning.
- A very long quote, name or company name: limits are enforced (quote 20–400 characters; names, roles and companies up to 100 characters), with counters shown as the limit approaches.
- Text containing markup or scripts: it is shown on the website as plain text, never as active content.
- An image with a very tall or wide shape: the preview shows the crop the website will apply, so the editor can choose a better image.
- An image that contains location or camera details embedded in the file: those details are removed before the image is published.
- Changes appear on one page but a stale copy is shown elsewhere: all places that show the content update within the same 5-minute window.
- An editor reorders items while another publishes a new one: the new item appears at the end of the order and nothing is lost.

## Requirements *(mandatory)*

### Functional Requirements

**Publishing workflow (shared by all content types, and reused by future ones)**

- **FR-001**: Every content item MUST have a status of either "Draft" or "Published"; new items start as "Draft".
- **FR-002**: Editors and admins MUST be able to save an item as a draft at any time, even when required fields or alternative text are incomplete.
- **FR-003**: Publishing MUST be refused until every required field is valid and every image on the item has acceptable alternative text; each problem MUST be shown next to its field.
- **FR-004**: Editors and admins MUST be able to unpublish a published item, returning it to "Draft" without losing its content.
- **FR-005**: Saving changes to a published item MUST apply the same checks as publishing; accepted changes replace the live version. (Keeping a separate unpublished draft of a live item requires version history, which is out of scope.)
- **FR-006**: Only items with status "Published" MUST ever appear on the public website or be retrievable by the public.
- **FR-007**: Publishing, unpublishing, editing, reordering and deleting MUST be reflected on every part of the public website that shows the item within 5 minutes, without a new deployment.
- **FR-008**: Deleting an item MUST require confirmation and permanently remove it and its images from the website and admin area.
- **FR-009**: The system MUST record, for each item, when it was created, last changed and last published, and by which team member; deletions, publishes and unpublishes MUST be recorded with the team member and time.
- **FR-010**: The system MUST warn when saving an item that someone else changed since it was opened, and MUST warn before leaving a form with unsaved changes.
- **FR-011**: Editors MUST be able to set the display order of items in each content type; the website MUST show published items in that order.

**Testimonials**

- **FR-012**: A testimonial MUST have name (required), role (required), company (required), country (required: Pakistan, UAE, UK, Other), quote (required, 20–400 characters), photo (optional, with alternative text if present) and video link (optional).
- **FR-013**: A video link, if given, MUST be a valid YouTube, Vimeo or Instagram address; on the website it is shown as a labelled link opening in a new tab.

**Client logos**

- **FR-014**: A client logo MUST have client name (required), logo image (required) with alternative text (required to publish) and website address (optional, must be a valid web address).

**Team members**

- **FR-015**: A team member MUST have name (required), role (required), photo (required to publish) with alternative text, and bio (required, up to 300 characters).

**Images**

- **FR-016**: Uploads MUST accept only JPEG, PNG and WebP images, verified by the file's actual content rather than its name, and MUST reject anything else with a clear message.
- **FR-017**: Uploads MUST be limited to 5 MB per image; larger files MUST be rejected with a message stating the file's size and the limit.
- **FR-018**: The system MUST warn when an image is below the minimum size for its use (photos 400 × 400 pixels, logos 200 pixels wide).
- **FR-019**: Editors MUST see a preview of the image as it will be displayed on the website (including cropping) before saving.
- **FR-020**: Alternative text MUST be required before publishing, MUST be 5–150 characters, and MUST NOT be just the file name.
- **FR-021**: Images MUST be automatically optimised and resized for fast loading on phones, and embedded location and camera information MUST be removed before publishing.
- **FR-022**: Replaced or deleted images MUST no longer be shown on the website.

**Access**

- **FR-023**: Both admins and editors MUST be able to perform every action in this feature; visitors who are not signed in MUST NOT be able to view drafts or make any change (access control as defined in feature 003).

**Content lists**

- **FR-024**: Each content type MUST have a list showing name, thumbnail, status, and last-changed person and time, filterable by status.

**Accessibility of the admin forms**

- **FR-025**: All content forms, reordering controls, uploads and previews MUST be usable with a keyboard and a screen reader, including a non-drag way to reorder items.

### Key Entities

- **Content item (shared)**: Anything managed through the publishing workflow. Has status (Draft/Published), display order, created/updated/published times and the team members responsible. Testimonials, client logos and team members are content items; case studies and blog posts will be in future.
- **Testimonial**: A client quote. Name, role, company, country, quote, optional photo, optional video link.
- **Client logo**: A client shown in the logo strip. Client name, logo image, optional website address.
- **Team member**: A person on the agency team shown on the website. Name, role, photo, short bio. (Separate from admin sign-in accounts in feature 003.)
- **Image**: An uploaded picture belonging to one content item. Has the image itself, alternative text, dimensions and upload time.
- **Content activity record**: Who created, changed, published, unpublished, reordered or deleted which item, and when.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An editor with no technical background can create and publish a testimonial with a photo in under 5 minutes on their first attempt.
- **SC-002**: 100% of publish, unpublish, edit, reorder and delete actions are visible on the public website within 5 minutes, with no deployment.
- **SC-003**: 0 draft items are visible on, or retrievable from, the public website.
- **SC-004**: 100% of published images have descriptive alternative text.
- **SC-005**: 100% of non-image files and images over 5 MB are rejected with a clear message and none are stored.
- **SC-006**: After launch, the team makes 100% of testimonial, logo and team changes without a developer.
- **SC-007**: Pages showing managed content still meet the site's mobile performance targets (feature 002) after images are added through this feature.

## Assumptions

- **Depends on feature 003**: Signing in, sessions and the Admin/Editor roles come from the secure admin area feature; this feature relies on them for access.
- **Existing screens**: Admin content screens and home-page sections for testimonials and client logos already exist with sample data; this feature defines the real behaviour they must meet.
- **Where team members appear**: The website does not yet have a team section; published team members appear on the About page when it is built (or another team section the agency chooses). Until then, the team member workflow is complete in the admin area.
- **Editing a live item** updates the live version on save (after passing publish checks). A separate draft copy of a published item would need version history, which is out of scope. Editors who want to prepare major changes privately can unpublish first.
- **"Remove" means permanent deletion** with confirmation, for all three content types. Unpublishing is the reversible option.
- **Ordering** is available for all three content types, not just logos, because team order (founders first) and testimonial order also matter.
- **Permission to publish**: Editors are responsible for having the client's or team member's permission to publish names, photos and quotes; the system does not track consent.
- **Image formats**: SVG logos are not accepted because they can carry active content; logos should be uploaded as PNG or WebP (transparent backgrounds supported). No in-browser cropping or editing tools are provided; the preview shows the automatic crop.
- **Update time**: "Within a few minutes" is taken as within 5 minutes.
- **Out of scope**: Case studies and blog posts, version history and restoring earlier versions, scheduled publishing, approval workflows (editors can publish directly), bulk upload, a shared media library, and multilingual content.
