# Feature Specification: SEO, Analytics and Trust Foundation

**Feature Branch**: `002-seo-analytics-foundation`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Establish the technical foundation that lets The Buzz Crew website be found, measured and trusted. The agency sells SEO, so its own site must meet the standard it promises clients. [...] Out of scope: blog, service pages, cookie consent for advertising pixels (handled with Meta tracking later)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search engines can find and understand the site (Priority: P1)

A search engine visiting the site finds a sitemap listing every public page, reads a unique title and description on each page, knows which address is the preferred (canonical) version of each page, and reads structured information describing The Buzz Crew as a business: its name, logo, Karachi location, contact details, the countries it serves and the services it offers.

**Why this priority**: Organic search is a core acquisition channel and the agency's own site is its first proof of SEO competence. Nothing else in this feature matters if pages cannot be found or understood.

**Independent Test**: Fetch the sitemap and robots file, then open each listed page and confirm a unique title, description and canonical address are present, and that structured business data validates without errors in a standard rich-results testing tool.

**Acceptance Scenarios**:

1. **Given** the live site, **When** the sitemap is requested, **Then** it lists every public, published page on the primary domain and no admin, draft, error, search-result or private pages.
2. **Given** the live site, **When** the robots file is requested, **Then** it allows public pages, blocks admin and other private areas, and points to the sitemap.
3. **Given** any public page, **When** its content is inspected, **Then** it has a title and meta description that no other page shares, and a canonical address on the primary domain.
4. **Given** the home page, **When** its structured data is tested, **Then** it describes the agency as a local business with name, logo, address in Karachi, contact email, phone, social profiles, areas served (Pakistan, UAE, UK) and services offered, with no validation errors.
5. **Given** a page that does not exist, **When** it is requested, **Then** a helpful "not found" page is shown with a "not found" status, and it is not indexed.
6. **Given** a non-production copy of the site (for example, a preview), **When** a search engine visits it, **Then** it is told not to index any page.

---

### User Story 2 - Shared links show a proper preview (Priority: P1)

A visitor shares a page from the site on WhatsApp, LinkedIn, Instagram (direct messages or bio link) or Facebook. The recipient sees a preview card with the page's title, a short description and a branded image, rather than a bare link.

**Why this priority**: WhatsApp and social sharing are how many prospects in Pakistan and the UAE first see the agency. A broken or blank preview looks unprofessional for a marketing agency.

**Independent Test**: Paste the address of each key page into WhatsApp and LinkedIn (or their preview-inspection tools) and confirm a card appears with the correct title, description and image.

**Acceptance Scenarios**:

1. **Given** any public page, **When** its address is shared on WhatsApp, LinkedIn or Facebook, **Then** the preview shows that page's title, description and a branded image.
2. **Given** a page without a specific image of its own, **When** it is shared, **Then** a default branded image with the page title is used, never a missing or broken image.
3. **Given** a preview image, **When** it is displayed, **Then** it is legible at small sizes, uses the agency's brand colours and logo, and is in a size and shape the major platforms display in full.

---

### User Story 3 - Visitors can read how their data is handled (Priority: P1)

A visitor who is about to submit the inquiry form, or who simply wants to know how the agency treats personal data, opens the privacy policy or the terms from the footer or the inquiry form. The privacy policy explains in plain language what the form collects, why, who it is shared with, how long it is kept, and how to request a copy or deletion.

**Why this priority**: Visitors from the UK in particular expect this, and the inquiry form collects personal data. Trust directly affects whether a visitor submits.

**Independent Test**: From the footer of any page and from the inquiry form, open the privacy policy and terms, and confirm the privacy policy answers each required question.

**Acceptance Scenarios**:

1. **Given** any public page, **When** the visitor looks at the footer, **Then** links to the privacy policy and terms are present.
2. **Given** the inquiry form, **When** the visitor reads it, **Then** it links to the privacy policy (and terms) before they submit.
3. **Given** the privacy policy, **When** it is read, **Then** it lists the personal data the inquiry form collects (name, email, phone, business name, country, services, budget, message), the purpose (responding to the inquiry and managing any resulting project), the services the data is shared with by category (for example, email delivery, hosting, bot protection, error reporting), the retention period, the visitor's rights, how to request a copy or deletion, the date it was last updated and how to contact the agency.
4. **Given** the privacy policy, **When** it is read, **Then** it explains what analytics and error reporting collect and confirms they do not collect names, emails, phone numbers or messages.
5. **Given** the terms, **When** they are read, **Then** they cover use of the website, intellectual property of site content, limits of liability for free tools and information, and the governing law, with a last-updated date.

---

### User Story 4 - One primary domain (Priority: P2)

Every visitor and search engine reaches the site on a single primary address. Any other address for the site (without "www", over an insecure connection, or on the hosting provider's default address) sends them permanently to the same page on the primary domain.

**Why this priority**: Duplicate addresses split search ranking and confuse analytics. It is required before launch but has no visitor-facing value on its own.

**Independent Test**: Request the home page and a deep page on each alternative address and confirm each responds with a single permanent redirect to the equivalent page on the primary domain over a secure connection.

**Acceptance Scenarios**:

1. **Given** a visitor enters the site address without "www", **When** the page loads, **Then** they are permanently redirected to the same path on `https://www.thebuzzcrew.com`.
2. **Given** a visitor uses an insecure (http) address, **When** the page loads, **Then** they are permanently redirected to the secure primary address.
3. **Given** a request to the hosting provider's default production address, **When** it is received, **Then** it is permanently redirected to the primary domain.
4. **Given** any redirect, **When** it happens, **Then** the path and query string are preserved and the visitor reaches the final page in a single redirect.

---

### User Story 5 - The agency can measure traffic and key actions (Priority: P2)

The agency team opens an analytics view and sees how many people visited, which pages they viewed, where they came from (search, social, ads, direct, including campaign tags), which countries and devices they used, and how many completed key actions: inquiry submitted and WhatsApp clicked.

**Why this priority**: The agency promises "measurable growth" to clients and needs the same evidence for its own marketing spend. It depends on pages existing but not on the other stories.

**Independent Test**: Visit several pages from a tagged campaign link, submit an inquiry and click WhatsApp, then confirm the analytics view shows the page views, the campaign source and both key events within the reporting delay.

**Acceptance Scenarios**:

1. **Given** a visitor views public pages, **When** the team checks analytics, **Then** page views appear by page, traffic source (including campaign tags), country and device type.
2. **Given** a visitor submits the inquiry form successfully, **When** the team checks analytics, **Then** one "inquiry submitted" event appears with the page it came from.
3. **Given** a visitor clicks a WhatsApp button, **When** the team checks analytics, **Then** a "WhatsApp clicked" event appears with the page it came from.
4. **Given** any recorded page view or event, **When** it is inspected, **Then** it contains no name, email, phone number, business name or message text.
5. **Given** visits to admin areas, **When** analytics is checked, **Then** they are not counted as public page views.

---

### User Story 6 - Errors are reported automatically and safely (Priority: P3)

When something breaks on the website, in the visitor's browser or on the server, the developer receives an automatic report with enough context to fix it (page, time, browser, error details), and the report never contains visitors' personal data.

**Why this priority**: Silent failures, especially on the inquiry form, cost leads. It is lower priority only because it does not affect visitors directly.

**Independent Test**: Trigger a test error on a page and while submitting a form that contains personal details, then confirm a report arrives with page and error context and without any of the entered personal details.

**Acceptance Scenarios**:

1. **Given** an unexpected error occurs in a visitor's browser or on the server, **When** it happens, **Then** a report is received by the developer within 5 minutes including the page, time, browser/device and error details.
2. **Given** an error occurs while a visitor is filling in or submitting the inquiry form, **When** the report is created, **Then** it contains no names, email addresses, phone numbers, business names or message text, including inside addresses, form values or request bodies.
3. **Given** a visitor experiences an error, **When** it happens, **Then** they see a friendly error page or message with a way to continue (return home, contact via WhatsApp), not technical details.
4. **Given** the same error happens many times, **When** reports are reviewed, **Then** they are grouped as one issue with a count rather than as separate alerts.

---

### Edge Cases

- A page's title or description would be empty or duplicated (for example, a new page added without its own): the site falls back to a sensible default, and duplicate titles or descriptions are caught before release.
- Pages with tracking parameters in their address (for example, campaign tags from ads): the canonical address omits the tracking parameters so they are not indexed as separate pages.
- Unpublished or draft content: it never appears in the sitemap, and if reached directly it is not indexed.
- A page is removed or renamed: the old address permanently redirects to the most relevant new page rather than showing "not found".
- Addresses with trailing slashes or capital letters: they resolve to one consistent lowercase form without duplicate indexable versions.
- A visitor uses an ad or tracker blocker: the site still works fully; only analytics for that visit is lost.
- The analytics or error-reporting service is unavailable: the site keeps working and pages are not slowed down noticeably.
- A preview image fails to generate: the default brand image is used instead.
- A very large number of errors in a short time (for example, a broken release): reporting is capped so it does not slow the site or exhaust the reporting allowance.

## Requirements *(mandatory)*

### Functional Requirements

**Discoverability**

- **FR-001**: The site MUST publish a sitemap listing every public, published page on the primary domain, with the date each page last changed where known, and MUST exclude admin, private, draft, error and non-indexable pages.
- **FR-002**: The site MUST publish a robots file that allows public pages, disallows admin and other private areas, and references the sitemap.
- **FR-003**: Every public page MUST have a unique title (including the agency name) and a unique meta description of roughly 70–160 characters that summarises that page.
- **FR-004**: Every public page MUST declare a canonical address on the primary domain, without tracking parameters.
- **FR-005**: Every public page MUST have exactly one main heading and a logical heading order.
- **FR-006**: Admin, private, preview-environment and "not found" pages MUST be marked as not to be indexed.
- **FR-007**: Requests for pages that do not exist MUST return a "not found" status and a helpful page linking to the home page, contact page and WhatsApp.

**Structured data**

- **FR-008**: The site MUST provide structured data describing the agency as an organisation and local business: name, logo, website, founding year, Karachi address, contact email and phone, social profiles, areas served (Pakistan, UAE, UK) and the services offered (Social Media, SEO, Web & Software, UI/UX Design, Meta Ads).
- **FR-009**: Pages with question-and-answer content (the FAQ) MUST provide matching FAQ structured data; pages below the home page MUST provide breadcrumb structured data.
- **FR-010**: All structured data MUST match the visible content of the page and pass a standard rich-results validation with no errors.

**Social previews**

- **FR-011**: Every public page MUST provide social preview information (title, description, image, page address, site name) recognised by WhatsApp, LinkedIn, Facebook and X.
- **FR-012**: Every public page MUST have a branded preview image, either specific to the page or a default that shows the page title with the agency's logo and colours, sized for full-width display on the major platforms and with descriptive alternative text.

**Privacy and terms**

- **FR-013**: The site MUST have a privacy policy page and a terms page, both linked from the footer of every public page and from the inquiry form.
- **FR-014**: The privacy policy MUST state: the personal data collected through the inquiry form and any other forms on the site; why it is collected; the categories of services it is shared with; that it is not sold; the retention period of [NEEDS CLARIFICATION: How long are inquiry details kept for leads that do not become clients?]; the visitor's rights (access, correction, deletion, objection); how to make a request and the response time (within 30 days); what analytics and error reporting collect; the agency's contact details; and a last-updated date.
- **FR-015**: The terms MUST cover acceptable use of the site, ownership of site content, that free tools and articles are general information and not professional guarantees, limits of liability, the governing law and a last-updated date.
- **FR-016**: Both pages MUST be written in plain, consistent British/international English and be readable on a phone.

**Primary domain**

- **FR-017**: The site MUST be served from one primary domain, `https://www.thebuzzcrew.com`, over a secure connection only.
- **FR-018**: All other addresses (without "www", insecure http, the hosting provider's default production address) MUST permanently redirect to the same path and query on the primary domain in a single redirect.
- **FR-019**: Page addresses MUST be lowercase and consistent in their use of trailing slashes; variants MUST redirect to the preferred form.

**Analytics**

- **FR-020**: The site MUST record page views on public pages, with page, referring source (including campaign tags), country and device type.
- **FR-021**: The site MUST record "inquiry submitted" and "WhatsApp clicked" events with the originating page, and the events MUST be viewable alongside page views in the analytics view.
- **FR-022**: Analytics MUST NOT collect names, email addresses, phone numbers, business names, message text or any other form input.
- **FR-023**: Analytics MUST work without requiring a consent prompt, meaning it MUST NOT store identifiers on the visitor's device or track visitors across other sites. Advertising pixels remain out of scope.
- **FR-024**: Admin areas MUST be excluded from public analytics.

**Error reporting**

- **FR-025**: Unexpected errors in the visitor's browser and on the server MUST be reported automatically to the development team, with page, time, release version, browser/device and error details.
- **FR-026**: Error reports MUST have names, email addresses, phone numbers, business names, message text, form values and request bodies removed before they leave the site, including when this data appears inside addresses or error messages.
- **FR-027**: Visitors who hit an error MUST see a friendly, on-brand message with a way to continue, never technical details.
- **FR-028**: Failure or slowness of analytics or error reporting MUST NOT break pages or noticeably slow them down.

**Quality bar**

- **FR-029**: Key pages (home, contact, FAQ, SEO audit tool, privacy policy) MUST score 90 or above for SEO and for Accessibility in a mobile Lighthouse audit.
- **FR-030**: Key pages MUST meet good Core Web Vitals on mobile (largest content shown within 2.5 seconds, responses to input within 200 milliseconds, layout shift no more than 0.1).
- **FR-031**: All meaningful images on public pages MUST have descriptive alternative text; decorative images MUST be ignored by screen readers.

### Key Entities

- **Public page**: Any page a visitor can reach without logging in. Has a title, description, canonical address, preview image, index/no-index status and last-changed date.
- **Business profile**: The single description of the agency used in structured data and the footer: name, logo, address, contact details, social profiles, areas served, services, founding year.
- **Analytics event**: A page view or key action (inquiry submitted, WhatsApp clicked) with page, time, source, country and device. Contains no personal details.
- **Error report**: An automatic record of a failure with page, time, release, browser/device and error details, grouped by issue. Contains no personal details.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of public pages have a unique title, unique meta description, canonical address and working social preview image, as confirmed by a full-site crawl with zero duplicates or missing values.
- **SC-002**: Key pages (home, contact, FAQ, SEO audit tool, privacy policy) score 90 or above for both SEO and Accessibility in a mobile Lighthouse audit.
- **SC-003**: The sitemap lists 100% of public, published pages and 0 admin, draft or non-indexable pages.
- **SC-004**: Structured data on the home page and FAQ page passes rich-results validation with 0 errors.
- **SC-005**: Within 4 weeks of launch, the search engine's site console reports all sitemap pages as discovered and no duplicate-without-canonical or redirect errors.
- **SC-006**: Every alternative address reaches the primary domain in exactly one permanent redirect.
- **SC-007**: Shared links to key pages show a complete preview (title, description, image) on WhatsApp, LinkedIn and Facebook.
- **SC-008**: The team can see weekly page views by source and the number of inquiry submissions and WhatsApp clicks without asking a developer.
- **SC-009**: A test error reaches the developer within 5 minutes, and an audit of error reports and analytics data finds 0 names, email addresses, phone numbers or messages.

## Assumptions

- **Primary domain**: `https://www.thebuzzcrew.com` (from the agency brochure) is the primary domain; the bare domain and all other addresses redirect to it. The agency controls the domain's DNS.
- **Scope of "every public page"**: The requirements apply to every public page that exists at release, including existing pages such as the home page, contact, FAQ, careers, industries, free tools, privacy and terms. Building the blog and service pages is out of scope; when they are built they must meet this foundation.
- **Business details**: The agency will provide the final address, phone number, WhatsApp number and social profile links for structured data and the footer; placeholders currently exist.
- **Analytics without consent**: Page-view and event analytics use a privacy-friendly approach that needs no consent prompt (no device identifiers, no cross-site tracking). Cookie consent for advertising pixels is out of scope and will be handled with the Meta tracking feature.
- **Relationship to the inquiry feature**: The "inquiry submitted" and "WhatsApp clicked" events are defined in feature 001 (project inquiry flow); this feature makes them visible in the analytics view alongside page views.
- **Legal review**: The privacy policy and terms are drafted to reflect the site's real behaviour; the agency is responsible for a final legal review. They are written with UK GDPR, the UAE PDPL and Pakistani law in mind, with a single governing law chosen by the agency (assumed Pakistan).
- **Data requests**: Access and deletion requests are made by email and handled manually within 30 days; an automated self-service tool is not part of this feature.
- **Key pages** for audit purposes are: home, contact, FAQ, SEO audit tool and privacy policy.
- **Out of scope**: Blog and service page content, cookie consent for advertising pixels, search-console account setup beyond sitemap submission, paid SEO tools, and multilingual versions of the site.
