import { serverApi } from "@/lib/auth/session";
import { clientLogoFromApi, teamMemberFromApi, testimonialFromApi } from "@/lib/content/api-mapping";
import type { ClientLogo, TeamMember, Testimonial } from "@/lib/content/types";

// Admin lists, loaded on the server with the visitor's session (drafts included).

export async function loadTestimonials(): Promise<Testimonial[]> {
  const api = await serverApi();
  const { data } = await api.GET("/api/v1/admin/content/testimonials", { cache: "no-store" });
  return (data ?? []).map(testimonialFromApi);
}

export async function loadClientLogos(): Promise<ClientLogo[]> {
  const api = await serverApi();
  const { data } = await api.GET("/api/v1/admin/content/client-logos", { cache: "no-store" });
  return (data ?? []).map(clientLogoFromApi);
}

export async function loadTeamMembers(): Promise<TeamMember[]> {
  const api = await serverApi();
  const { data } = await api.GET("/api/v1/admin/content/team-members", { cache: "no-store" });
  return (data ?? []).map(teamMemberFromApi);
}
