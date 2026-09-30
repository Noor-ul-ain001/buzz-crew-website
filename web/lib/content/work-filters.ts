import { z } from "zod";
import { INDUSTRIES, SERVICES_API, fromUrlValue, toUrlValue, type ApiService, type Industry } from "@/lib/content/work-labels";

export type WorkFilters = { industry: Industry | null; service: ApiService | null; page: number };

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

// Unknown values are dropped silently: an old or hand-edited link still shows the list.
const schema = z.object({
  industry: z.preprocess(first, z.string().transform(fromUrlValue).pipe(z.enum(INDUSTRIES)).optional().catch(undefined)),
  service: z.preprocess(first, z.string().transform(fromUrlValue).pipe(z.enum(SERVICES_API)).optional().catch(undefined)),
  page: z.preprocess(first, z.coerce.number().int().min(1).max(100).optional().catch(undefined)),
});

export function parseWorkFilters(params: Record<string, string | string[] | undefined>): WorkFilters {
  const parsed = schema.parse(params);
  return { industry: parsed.industry ?? null, service: parsed.service ?? null, page: parsed.page ?? 1 };
}

/** The shareable /work address for a set of filters. */
export function workHref({ industry, service, page }: Partial<WorkFilters>): string {
  const params = new URLSearchParams();
  if (industry) params.set("industry", toUrlValue(industry));
  if (service) params.set("service", toUrlValue(service));
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/work?${query}` : "/work";
}
