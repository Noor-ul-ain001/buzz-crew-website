import type { Schemas } from "@/lib/api/client";
import { apiRequest } from "@/lib/api/request";
import { errorCode, errorMessage } from "@/lib/auth/errors";
import { imageFromApi } from "@/lib/content/api-mapping";
import { syncAltText } from "@/lib/content/admin-api";
import type { CaseStudyDetail } from "@/lib/content/case-studies";
import type { ImageAsset } from "@/lib/content/types";

export type CaseStudyAdmin = Schemas["CaseStudyAdmin"];
export type Industry = Schemas["Industry"];
export type ApiService = Schemas["Service"];

const BASE = "/api/v1/admin/content/case-studies";

export type ResultValues = { value: string; label: string; period: string; starting_value: string; is_headline: boolean };
export type MediaValues = { kind: "image" | "reel"; image: ImageAsset | null; video_url: string; description: string };

/** Everything the editor form holds (images as ImageAsset, so the ImageField can manage them). */
export type CaseStudyFormValues = {
  slug: string;
  client_name: string;
  title: string;
  summary: string;
  industry: Industry | "";
  country: Schemas["Country"] | "";
  services: ApiService[];
  challenge_md: string;
  strategy_md: string;
  execution_md: string;
  project_period: string;
  cover: ImageAsset | null;
  before_image: ImageAsset | null;
  after_image: ImageAsset | null;
  before_label: string;
  after_label: string;
  testimonial_id: string;
  seo_title: string;
  seo_description: string;
  results: ResultValues[];
  media: MediaValues[];
};

export const EMPTY_CASE_STUDY: CaseStudyFormValues = {
  slug: "",
  client_name: "",
  title: "",
  summary: "",
  industry: "",
  country: "",
  services: [],
  challenge_md: "",
  strategy_md: "",
  execution_md: "",
  project_period: "",
  cover: null,
  before_image: null,
  after_image: null,
  before_label: "Before",
  after_label: "After",
  testimonial_id: "",
  seo_title: "",
  seo_description: "",
  results: [],
  media: [],
};

export function toFormValues(item: CaseStudyAdmin): CaseStudyFormValues {
  return {
    slug: item.slug,
    client_name: item.client_name,
    title: item.title,
    summary: item.summary,
    industry: item.industry ?? "",
    country: item.country ?? "",
    services: item.services,
    challenge_md: item.challenge_md,
    strategy_md: item.strategy_md,
    execution_md: item.execution_md,
    project_period: item.project_period ?? "",
    cover: imageFromApi(item.cover),
    before_image: imageFromApi(item.before_image),
    after_image: imageFromApi(item.after_image),
    before_label: item.before_label,
    after_label: item.after_label,
    testimonial_id: item.testimonial_id ?? "",
    seo_title: item.seo_title ?? "",
    seo_description: item.seo_description ?? "",
    results: item.results.map((r) => ({ ...r, starting_value: r.starting_value ?? "" })),
    media: item.media.map((m) => ({
      kind: m.kind,
      image: imageFromApi(m.media),
      video_url: m.video_url ?? "",
      description: m.description ?? "",
    })),
  };
}

/** A best-effort address from the client and title, like the API's own suggestion. */
export function suggestSlug(clientName: string, title: string): string {
  return `${clientName} ${title}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

const orNull = (value: string) => value.trim() || null;

function toBody(values: CaseStudyFormValues) {
  return {
    slug: values.slug.trim() || null,
    client_name: values.client_name,
    title: values.title,
    summary: values.summary,
    industry: values.industry || null,
    country: values.country || null,
    services: values.services,
    challenge_md: values.challenge_md,
    strategy_md: values.strategy_md,
    execution_md: values.execution_md,
    project_period: orNull(values.project_period),
    cover_id: values.cover?.mediaId ?? null,
    before_image_id: values.before_image?.mediaId ?? null,
    after_image_id: values.after_image?.mediaId ?? null,
    before_label: values.before_label || "Before",
    after_label: values.after_label || "After",
    testimonial_id: values.testimonial_id || null,
    seo_title: orNull(values.seo_title),
    seo_description: orNull(values.seo_description),
    results: values.results.map((r) => ({ ...r, starting_value: orNull(r.starting_value) })),
    media: values.media
      .filter((m) => m.image?.mediaId)
      .map((m) => ({
        kind: m.kind,
        media_id: m.image?.mediaId,
        video_url: m.kind === "reel" ? orNull(m.video_url) : null,
        description: orNull(m.description),
      })),
  };
}

export class CaseStudySaveError extends Error {
  constructor(
    message: string,
    readonly fields: Record<string, string> = {},
    readonly code?: string,
    readonly saved?: CaseStudyAdmin,
  ) {
    super(message);
  }
}

function problemFields(error: unknown): Record<string, string> {
  const detail = (error as { detail?: unknown } | null)?.detail;
  const fields: Record<string, string> = {};
  if (Array.isArray(detail)) {
    for (const issue of detail as { loc: (string | number)[]; msg: string }[]) {
      const [, first, ...rest] = issue.loc;
      const key = typeof first === "string" ? (rest.length ? `${first}[]` : first) : "form";
      fields[key] = issue.msg.replace(/^Value error, /, "");
    }
  } else if (detail && typeof detail === "object" && "fields" in detail) {
    Object.assign(fields, (detail as { fields: Record<string, string> }).fields);
  }
  return fields;
}

async function call<T>(method: string, path: string, body?: unknown, saved?: CaseStudyAdmin): Promise<T> {
  const result = await apiRequest<T>(method, path, body);
  if (!result.ok) {
    throw new CaseStudySaveError(errorMessage(result.error), problemFields(result.error), errorCode(result.error), saved);
  }
  return result.data as T;
}

export async function saveCaseStudy(
  existing: { id: string; version: number; status: "draft" | "published" } | null,
  values: CaseStudyFormValues,
  action: "draft" | "publish" | "unpublish",
): Promise<CaseStudyAdmin> {
  await syncAltText([values.cover, values.before_image, values.after_image, ...values.media.map((m) => m.image)]);
  const body = toBody(values);
  let version = existing?.version ?? 1;
  if (existing && action === "unpublish") {
    version = (await call<CaseStudyAdmin>("POST", `${BASE}/${existing.id}/unpublish`)).version;
  }
  const saved = existing
    ? await call<CaseStudyAdmin>("PATCH", `${BASE}/${existing.id}`, { ...body, version })
    : await call<CaseStudyAdmin>("POST", BASE, body);
  if (action !== "publish") return saved;
  return call<CaseStudyAdmin>("POST", `${BASE}/${saved.id}/publish`, undefined, saved);
}

export async function reorderCaseStudies(ids: string[]) {
  await call("PUT", `${BASE}/order`, { ids });
}

export async function deleteCaseStudy(id: string) {
  await call("DELETE", `${BASE}/${id}`);
}

/** The admin item in the public page's shape, for the signed-in preview. */
export function previewDetail(item: CaseStudyAdmin): CaseStudyDetail {
  const image = (media: Schemas["MediaOut"] | null | undefined) =>
    media
      ? { url: media.url, alt: media.alt_text ?? "", width: media.width, height: media.height }
      : { url: "/home/hero-network.webp", alt: "", width: 1600, height: 900 };
  const results = item.results.map((r) => ({ ...r, starting_value: r.starting_value ?? null }));
  const flagged = results.filter((r) => r.is_headline).slice(0, 3);
  return {
    slug: item.slug,
    client_name: item.client_name || "Client name",
    title: item.title || "Untitled case study",
    summary: item.summary,
    industry: item.industry ?? "other",
    country: item.country ?? "other",
    services: item.services,
    headline_metrics: flagged.length ? flagged : results.slice(0, 1),
    cover: image(item.cover),
    challenge_md: item.challenge_md,
    strategy_md: item.strategy_md,
    execution_md: item.execution_md,
    project_period: item.project_period ?? null,
    results,
    media: item.media.map((m) => ({ kind: m.kind, image: image(m.media), video_url: m.video_url ?? null, description: m.description ?? null })),
    before_after:
      item.before_image && item.after_image
        ? { before: image(item.before_image), after: image(item.after_image), before_label: item.before_label, after_label: item.after_label }
        : null,
    testimonial: null,
    related: [],
    seo_title: item.seo_title || item.title,
    seo_description: item.seo_description || item.summary,
    published_at: item.published_at ?? item.updated_at,
    updated_at: item.updated_at,
  };
}
