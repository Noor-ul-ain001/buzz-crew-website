import { serverApi } from "@/lib/auth/session";
import type { CaseStudyAdmin } from "@/lib/content/case-study-admin";

// Admin reads on the server with the visitor's session (drafts included).

export async function loadCaseStudies(): Promise<CaseStudyAdmin[]> {
  const api = await serverApi();
  const { data } = await api.GET("/api/v1/admin/content/case-studies", { cache: "no-store" });
  return data ?? [];
}

export async function loadCaseStudy(id: string): Promise<CaseStudyAdmin | null> {
  const api = await serverApi();
  const { data } = await api.GET("/api/v1/admin/content/case-studies/{item_id}", {
    params: { path: { item_id: id } },
    cache: "no-store",
  });
  return data ?? null;
}

/** Testimonials for the quote picker (drafts included; only published ones show publicly). */
export async function loadTestimonialOptions(): Promise<{ id: string; label: string }[]> {
  const api = await serverApi();
  const { data } = await api.GET("/api/v1/admin/content/testimonials", { cache: "no-store" });
  return (data ?? []).map((t) => ({
    id: t.id,
    label: `${t.name}${t.company ? `, ${t.company}` : ""}${t.status === "draft" ? " (draft)" : ""}`,
  }));
}
