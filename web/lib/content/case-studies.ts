import type { Schemas } from "@/lib/api/client";
import type { WorkFilters } from "@/lib/content/work-filters";

export type CaseStudyCardData = Schemas["CaseStudyCard"];
export type CaseStudyDetail = Schemas["CaseStudyDetail"];
export type CaseStudyPage = Schemas["CaseStudyPage"];

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8000";
const BASE = `${API_ORIGIN}/api/v1/public/case-studies`;
// Pages refresh at once when the API calls /api/revalidate, and within 5 minutes regardless.
const REVALIDATE_SECONDS = 300;

const EMPTY_PAGE: CaseStudyPage = { items: [], total: 0, page: 1, facets: { industries: [], services: [] } };

export async function getCaseStudyPage(filters: WorkFilters, pageSize: 3 | 12 = 12): Promise<CaseStudyPage> {
  const params = new URLSearchParams({ page: String(filters.page), page_size: String(pageSize) });
  if (filters.industry) params.set("industry", filters.industry);
  if (filters.service) params.set("service", filters.service);
  try {
    const response = await fetch(`${BASE}?${params}`, {
      next: { tags: ["case-studies"], revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as CaseStudyPage;
  } catch (error) {
    console.error("Couldn't load case studies:", error instanceof Error ? error.message : error);
    return { ...EMPTY_PAGE, page: filters.page };
  }
}

export type CaseStudyLookup =
  | { kind: "found"; caseStudy: CaseStudyDetail }
  | { kind: "redirect"; slug: string }
  | { kind: "missing" };

export async function getCaseStudy(slug: string): Promise<CaseStudyLookup> {
  const response = await fetch(`${BASE}/${encodeURIComponent(slug)}`, {
    next: { tags: ["case-studies", `case-study:${slug}`], revalidate: REVALIDATE_SECONDS },
  });
  if (response.status === 404) return { kind: "missing" };
  if (!response.ok) throw new Error(`Couldn't load the case study (HTTP ${response.status}).`);
  const body = (await response.json()) as CaseStudyDetail | { redirect_to: string };
  return "redirect_to" in body ? { kind: "redirect", slug: body.redirect_to } : { kind: "found", caseStudy: body };
}

export async function getCaseStudySlugs(): Promise<{ slug: string; updated_at: string }[]> {
  try {
    const response = await fetch(`${BASE}/slugs`, { next: { tags: ["case-studies"], revalidate: REVALIDATE_SECONDS } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch {
    return [];
  }
}
