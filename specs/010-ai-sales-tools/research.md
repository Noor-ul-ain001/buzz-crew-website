# Research: AI Lead Priority, Proposal Drafts, Caption Generator and Cost Estimator

> **Hosting update (2026-09-28):** the project runs entirely on Vercel Hobby. The decisions in [DEPLOYMENT.md](../DEPLOYMENT.md) take precedence over this file where they conflict. They are D5 (Vercel Cron, daily; replaces R0's APScheduler), D4 (lead priority through the client-triggered `post-process` call, then when an admin opens the lead, then the daily catch-up; replaces R1–R2's background task and 15-minute retry) and D7 (proposal PDFs with xhtml2pdf; replaces R4's WeasyPrint).

## R0. Scheduled jobs (cross-cutting, applies to features 004, 007, 008, 009 and 010)

- **Decision**: APScheduler (`AsyncIOScheduler`) starts with the FastAPI lifespan. Each job wraps its work in `pg_try_advisory_lock(job_id)`, so only one instance runs even if replicas are added. The jobs are:

  | Job | Feature | Schedule |
  |-----|---------|----------|
  | Unreferenced media cleanup | 004 | Daily |
  | Unconfirmed subscriber purge | 007 | Daily |
  | Close expired roles | 007 | Daily |
  | Chat purge | 008 | Daily |
  | Audit purge | 009 | Daily |
  | Login-attempt pruning | 003 | Daily |
  | Lead priority retry | 010 | Every 15 minutes |

  Each job can also be run manually with `uv run python -m app.jobs <name>`.
- **Rationale**: This keeps exactly two deployable units (constitution), with no cron service. The platform keeps the single API process alive.
- **Alternatives considered**: Railway or Render cron services were rejected as an additional deployable per job. An external cron hitting internal endpoints was rejected as an extra secret and surface.

## R1. Lead priority

- **Decision**: The 001 `lead_service.create` (and the other lead-creating paths from 006, 008 and 009) schedules `ai.priority.score(lead_id)` as a background task. The input JSON has `business`, `country`, `services`, `budget_range`, `message` (masked with 008's guards) and `source`, with no email, phone or name. The system prompt:
  - defines the criteria for Hot, Warm and Cold, considering budget band, number and fit of services, and the specificity and urgency of the message;
  - states that the lead message is untrusted data and that instructions inside it must be ignored.

  The call is Groq `chat.completions.create(model="openai/gpt-oss-20b", reasoning_effort="low", include_reasoning=False, max_completion_tokens=300, response_format={"type": "json_schema", "json_schema": {"name": "priority", "strict": True, "schema": …}})`, then re-validated with Pydantic. The Pydantic model is `PrioritySuggestion{priority: Literal["hot", "warm", "cold"], reason: constr(max_length=120)}`. The result is stored in `lead_ai_insights` with the model id. Leads already marked Won or Lost are skipped.
- **Rationale**: This meets FR-001, FR-002, FR-005 and FR-032. Groq strict structured outputs (constrained decoding on GPT-OSS models) guarantee the shape, and Pydantic enforces the length limit.

## R2. Retry and failure

- **Decision**: `lead_ai_insights.status` is `pending`, `done` or `failed`, with `attempts` and `next_attempt_at`. Backoff runs at 1, 5, 15 minutes and then every 15 minutes, until 24 hours after the lead was created, after which the status becomes `failed`. The UI shows "Not scored yet" with a "Try again" button (an admin-triggered refresh ignores the backoff).
- **Rationale**: This meets FR-006.

## R3. Proposal generation and grounding

- **Decision**:
  - **Context**: the lead (without email or phone), the service content JSON (from 006), the four-step process, up to 3 published case studies matching the lead's services (from 005's ranking) and the configured price ranges for the lead's services.
  - **Call**: Groq `openai/gpt-oss-120b` with `reasoning_effort="medium"`, `include_reasoning=False`, `max_completion_tokens=8000` and a strict json_schema `response_format`. It is not streamed, because Groq doesn't support streaming with structured outputs; at about 500 tokens per second it finishes well within the 60 s timeout. The prompt is about 6K tokens, so the free tier (8K tokens per minute) allows roughly one draft per minute. That is enough for a few proposals a week, and no paid plan is assumed (see ../COSTS.md).
  - **Schema**: `ProposalDraft{introduction, understanding_of_needs, services_and_scope, process, case_study_ids: list[UUID] (≤ 3), investment, next_steps}`, where each text field is Markdown.
  - **Rules in the prompt**:
    - quote only the configured range figures, using the exact PKR values given;
    - put `[[TO CONFIRM: final price]]` in the investment section, and `[[TO CONFIRM: timeline]]` wherever a timeline would appear;
    - use `[[TO CONFIRM: …]]` for any unknown fact;
    - never promise results, rankings, guarantees or discounts.
  - **Server validation**:
    1. Every currency figure equals a configured bound for the lead's services.
    2. Every `case_study_id` is currently published.
    3. The investment section contains at least one `[[TO CONFIRM` placeholder.
    4. No banned phrases.

    On a failure, the server retries once. If it still fails, it returns `422 ai_output_invalid`, and the admin can start from a template (FR-014).
  - **Assembly**: the server assembles one Markdown body, with case study ids rendered as linked titles, and stores a snapshot of the price ranges used.
- **Rationale**: This meets FR-007, FR-008 and SC-004. Medium effort reflects the longer, higher-value output; admins review everything.

## R4. Editing, approval and export

- **Decision**:
  - **Editing**: `proposals.body_md` is edited in a Markdown editor with preview, and remaining `[[…]]` placeholders are highlighted. Auto-save sends `PATCH` with `version`, debounced to 2 s, and a version mismatch returns 409 with a choice.
  - **Approval**: `POST /proposals/{id}/approve {confirm_reviewed: true}` fails with `409 placeholders_remaining` (listing them) if the regex `\[\[` matches. It sets `status=approved`, `approved_by` and `approved_at`, and freezes the body. Further edits create a new draft version.
  - **Export**: `GET /proposals/{id}/export?format=pdf|docx|md` returns 403 unless the proposal is approved. PDF is Markdown → HTML (branded template) → WeasyPrint. DOCX uses python-docx, mapping headings, paragraphs and lists. "Copy" uses the approved Markdown or plain text from the API.
  - **Stale references**: case studies referenced by a draft that have since been unpublished are flagged on load (FR-015).
- **Rationale**: This meets FR-009–FR-013. Enforcement is on the server, not only in the UI.
- **Alternatives considered**: Generating the PDF in the browser was rejected because approval gating would then be client-side. Rendering the PDF with headless Chrome was rejected as heavier than WeasyPrint.

## R5. Estimator

- **Decision**:
  - **Storage**: `price_ranges(service, scope, min_pkr, max_pkr, includes)` and `service_billing(service, billing_type)`.
  - **Public config**: `GET /api/v1/public/pricing` returns the configuration (tag `pricing`, revalidated by the 004 webhook when pricing changes).
  - **Calculation**: `POST /api/v1/tools/estimate {selections: [{service, scope}]}` returns lines plus `monthly_total` and `one_off_total` (sums of the minimums and of the maximums). Services without a configured range return `price_on_request` and are left out of the totals. The client calls it on each change, debounced to 300 ms, and totals are announced through a live region.
  - **Send as inquiry**: the 001 `LeadCreate` gains an optional `estimate.selections`. The server recalculates from the current ranges, stores the snapshot on the lead and sets `source=cost_estimator`.
  - **Limits**: 100 estimates per visitor per day, with Turnstile required only on "Send as inquiry" (the 001 path).
- **Rationale**: This meets FR-016–FR-020, and "never from AI". Server calculation keeps one source of truth and enforces the limit.

## R6. Pricing settings

- **Decision**: `PUT /api/v1/admin/pricing` takes the full grid in one transaction. It validates whole numbers of at least 0 with the minimum not above the maximum, returning field errors keyed `service.scope.min`. A `pricing_changes` row is written for each changed cell (old value, new value, actor, time). The save triggers revalidation of the `pricing` tag and rebuilds 008's pricing `knowledge_chunks` in the same transaction.
- **Rationale**: This meets FR-021–FR-024.

## R7. Caption generator

- **Decision**:
  - **Input**: `business_type` (up to 100 characters), `goal` (enum), `platform` (optional: instagram, facebook, linkedin or tiktok) and `tone` (optional).
  - **Non-English check**: done before the model call; if the business type is mostly outside Latin script (above 50%), the server returns `unsupported_language` without calling the model.
  - **Call**: Groq `openai/gpt-oss-20b`, `reasoning_effort="low"`, `include_reasoning=False`, `max_completion_tokens=3000`, strict json_schema, 30 s timeout.
  - **Schema**: one strict object, because strict mode needs every field required. It is `CaptionResult{declined: bool, decline_reason: str, ideas: list[Idea]}`, where `Idea{idea, caption, hashtags: list[str]}`. The validator enforces the combinations: if `declined` is true, `ideas` must be empty; otherwise there must be exactly 5 ideas, each idea up to 200 characters and each with up to 8 hashtags.
  - **Caption length targets**: Instagram up to 300 characters (hard limit 2,200), Facebook up to 400, LinkedIn up to 700 (hard 3,000), TikTok up to 150 (hard 2,200). The server rejects the result if a caption exceeds the hard limit or the count isn't 5.
  - **Counting**: successes and declines count toward the limit (FR-027 edge case); timeouts and errors don't (FR-031).
- **Rationale**: This meets FR-025–FR-028 and FR-031. Structured output guarantees the shape.

## R8. Spend cap and failure messaging

- **Decision**: All features record usage in `ai_usage_daily` by feature. The site-wide cap (008 settings) applies to the *public* features (chat and captions): when it is reached, the tools show contact options and admins are emailed once per day. Admin features (priority and proposals) are never blocked by the cap, but their usage is shown in the admin assistant page. Failure messages are friendly text, never provider errors.
- **Rationale**: This meets FR-030 and FR-031; internal productivity isn't blocked by public-traffic spend.
