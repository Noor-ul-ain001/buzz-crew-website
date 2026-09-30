import { serverApi } from "@/lib/auth/session";
import { leadFromApi } from "@/lib/leads/api";
import type { Lead } from "@/lib/leads/types";

// Leads loaded on the server with the admin's session. Call only after checking the role:
// lead data must never reach an editor's browser.

export async function loadLeads(): Promise<Lead[]> {
  const api = await serverApi();
  const { data } = await api.GET("/api/v1/leads", { cache: "no-store" });
  return (data?.items ?? []).map(leadFromApi);
}

export async function loadLead(id: string): Promise<Lead | null> {
  const api = await serverApi();
  const { data } = await api.GET("/api/v1/leads/{lead_id}", { params: { path: { lead_id: id } }, cache: "no-store" });
  return data ? leadFromApi(data) : null;
}
