import { apiRequest } from "@/lib/api/request";

// Newsletter sign-ups are stored by the API and listed in the admin area.

export async function subscribeToNewsletter(email: string, sourcePage: string): Promise<void> {
  const result = await apiRequest("POST", "/api/v1/newsletter", { email, source_page: sourcePage });
  if (!result.ok) throw new Error("subscribe_failed");
}
