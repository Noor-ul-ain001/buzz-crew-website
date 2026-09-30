import type { Schemas } from "@/lib/api/client";
import { apiRequest } from "@/lib/api/request";
import { errorMessage } from "@/lib/auth/errors";
import { clientLogoFromApi, countryToApi, teamMemberFromApi, testimonialFromApi } from "@/lib/content/api-mapping";
import type { ClientLogo, ContentCollections, ImageAsset, TeamMember, Testimonial } from "@/lib/content/types";

// Client-side calls to the 004 content API. Posts and FAQs stay on mock data until
// features 006 and 007 give them endpoints.

export type ApiKind = "testimonials" | "logos" | "team";
export const API_KINDS: readonly ApiKind[] = ["testimonials", "logos", "team"];

export function isApiKind(kind: string): kind is ApiKind {
  return (API_KINDS as readonly string[]).includes(kind);
}

export const API_SLUG: Record<ApiKind, string> = {
  testimonials: "testimonials",
  logos: "client-logos",
  team: "team-members",
};

type Item<K extends ApiKind> = ContentCollections[K];
type Fields<K extends ApiKind> = Omit<Item<K>, "id" | "status" | "updatedAt" | "version" | "updatedByName" | "thumbnailUrl">;
export type PublishAction = "draft" | "publish" | "unpublish";

export class ContentApiError extends Error {
  constructor(
    message: string,
    /** Form field → message, from publish checks or field validation. */
    readonly fields: Record<string, string> = {},
    /** Set when the item was saved as a draft but couldn't be published. */
    readonly saved?: Item<ApiKind>,
  ) {
    super(message);
  }
}

export class VersionConflictError extends Error {
  constructor(
    readonly current: Item<ApiKind>,
    readonly changedBy: string,
  ) {
    super("version_conflict");
  }
}

const FROM_API = {
  testimonials: (item: unknown) => testimonialFromApi(item as Schemas["TestimonialAdmin"]),
  logos: (item: unknown) => clientLogoFromApi(item as Schemas["ClientLogoAdmin"]),
  team: (item: unknown) => teamMemberFromApi(item as Schemas["TeamMemberAdmin"]),
} as const;

export function fromApi<K extends ApiKind>(kind: K, item: unknown): Item<K> {
  return FROM_API[kind](item) as Item<K>;
}

const mediaId = (image: ImageAsset | null) => image?.mediaId ?? null;

function toBody(kind: ApiKind, fields: Fields<ApiKind>): Record<string, unknown> {
  if (kind === "testimonials") {
    const t = fields as Fields<"testimonials"> & Partial<Testimonial>;
    return {
      name: t.name,
      role: t.role,
      company: t.company,
      country: countryToApi(t.country),
      quote: t.quote,
      photo_id: mediaId(t.photo),
      video_url: t.videoUrl || null,
    };
  }
  if (kind === "logos") {
    const l = fields as Fields<"logos"> & Partial<ClientLogo>;
    return { name: l.name, logo_id: mediaId(l.logo), website_url: l.websiteUrl || null };
  }
  const m = fields as Fields<"team"> & Partial<TeamMember>;
  return { name: m.name, role: m.role, bio: m.bio, photo_id: mediaId(m.photo) };
}

const FIELD_NAMES: Record<string, string> = {
  video_url: "videoUrl",
  website_url: "websiteUrl",
  photo_id: "photo",
  logo_id: "logo",
};

/** "photo.alt_text" → "photo", "video_url" → "videoUrl". */
export function formField(apiField: string): string {
  const base = apiField.split(".")[0];
  return FIELD_NAMES[base] ?? base;
}

export function fieldErrors(error: unknown): Record<string, string> {
  const detail = (error as { detail?: unknown } | null)?.detail;
  const fields: Record<string, string> = {};
  if (Array.isArray(detail)) {
    // FastAPI validation: [{ loc: ["body", "video_url"], msg: "Value error, …" }]
    for (const issue of detail as { loc: (string | number)[]; msg: string }[]) {
      const name = issue.loc[issue.loc.length - 1];
      if (typeof name === "string") fields[formField(name)] = issue.msg.replace(/^Value error, /, "");
    }
  } else if (detail && typeof detail === "object" && "fields" in detail) {
    for (const [name, message] of Object.entries((detail as { fields: Record<string, string> }).fields)) {
      fields[formField(name)] = message;
    }
  }
  return fields;
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const result = await apiRequest<T>(method, path, body);
  if (!result.ok) throw new ContentApiError(errorMessage(result.error), fieldErrors(result.error));
  return result.data as T;
}

/** Saves changed alt text on images the API already stores. */
export async function syncAltText(images: (ImageAsset | null)[]) {
  for (const image of images) {
    if (image?.mediaId && image.alt.trim() !== (image.savedAlt ?? "")) {
      await call("PATCH", `/api/v1/admin/media/${image.mediaId}`, { alt_text: image.alt.trim() });
    }
  }
}

function imagesOf(fields: Fields<ApiKind>): (ImageAsset | null)[] {
  return ["photo", "logo"].map((key) => (fields as unknown as Record<string, ImageAsset | null | undefined>)[key] ?? null);
}

type Existing = { id: string; version?: number; status: "Draft" | "Published" };

/**
 * Save draft / Publish / Unpublish against the API. New items are created as drafts first,
 * so a failed publish still keeps the admin's work (returned on the error as `saved`).
 */
export async function saveContent<K extends ApiKind>(
  kind: K,
  existing: Existing | undefined,
  fields: Fields<K>,
  action: PublishAction,
): Promise<Item<K>> {
  const base = `/api/v1/admin/content/${API_SLUG[kind]}`;
  await syncAltText(imagesOf(fields));
  const body = toBody(kind, fields);

  let raw: unknown;
  let version = existing?.version ?? 1;
  if (existing && action === "unpublish") {
    // Unpublish first: once it's a draft, the edits save without the publish checks.
    raw = await call("POST", `${base}/${existing.id}/unpublish`);
    version = (raw as { version: number }).version;
  }
  if (!existing) {
    raw = await call("POST", base, body);
  } else {
    const result = await apiRequest<unknown>("PATCH", `${base}/${existing.id}`, { ...body, version });
    if (result.status === 409) {
      const detail = (result.error as { detail: { current: unknown } }).detail;
      const current = fromApi(kind, detail.current);
      throw new VersionConflictError(current, current.updatedByName ?? "someone else");
    }
    if (!result.ok) throw new ContentApiError(errorMessage(result.error), fieldErrors(result.error));
    raw = result.data;
  }

  if (action === "publish") {
    const saved = fromApi(kind, raw);
    const published = await apiRequest<unknown>("POST", `${base}/${saved.id}/publish`);
    if (!published.ok) {
      throw new ContentApiError(
        "Saved as a draft. Fix the highlighted fields to publish.",
        fieldErrors(published.error),
        saved,
      );
    }
    raw = published.data;
  }
  return fromApi(kind, raw);
}

export async function reorderContent(kind: ApiKind, ids: string[]) {
  await call("PUT", `/api/v1/admin/content/${API_SLUG[kind]}/order`, { ids });
}

export async function deleteContent(kind: ApiKind, id: string) {
  await call("DELETE", `/api/v1/admin/content/${API_SLUG[kind]}/${id}`);
}

export async function publishContent<K extends ApiKind>(kind: K, id: string, publish: boolean): Promise<Item<K>> {
  const raw = await call("POST", `/api/v1/admin/content/${API_SLUG[kind]}/${id}/${publish ? "publish" : "unpublish"}`);
  return fromApi(kind, raw);
}
