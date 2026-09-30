import type { Schemas } from "@/lib/api/client";
import {
  publicClientLogoFromApi,
  publicFaqFromApi,
  publicPostFromApi,
  publicTeamMemberFromApi,
  publicTestimonialFromApi,
} from "@/lib/content/api-mapping";
import type { BlogPost, ClientLogo, FaqItem, TeamMember, Testimonial } from "@/lib/content/types";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8000";
// Pages refresh at once when the API calls /api/revalidate, and within 5 minutes regardless.
const REVALIDATE_SECONDS = 300;

async function getPublic<T>(path: string, tag: string): Promise<T[]> {
  try {
    const response = await fetch(`${API_ORIGIN}/api/v1/public/${path}`, {
      next: { tags: [tag], revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T[];
  } catch (error) {
    // The section is hidden rather than breaking the page (FR: empty list hides it).
    console.error(`Couldn't load ${path}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  const items = await getPublic<Schemas["PublicTestimonial"]>("testimonials", "testimonials");
  return items.map(publicTestimonialFromApi);
}

export async function getPublishedClientLogos(): Promise<ClientLogo[]> {
  const items = await getPublic<Schemas["PublicClientLogo"]>("client-logos", "client-logos");
  return items.map(publicClientLogoFromApi);
}

export async function getPublishedTeamMembers(): Promise<TeamMember[]> {
  const items = await getPublic<Schemas["PublicTeamMember"]>("team-members", "team-members");
  return items.map(publicTeamMemberFromApi);
}

export async function getPublishedFaqs(): Promise<FaqItem[]> {
  const items = await getPublic<Schemas["PublicFaq"]>("faqs", "faqs");
  return items.map(publicFaqFromApi);
}

/** Published blog posts, in the API's order (newest first is applied by lib/data/blog). */
export async function getPublishedPostsFromApi(): Promise<BlogPost[]> {
  const items = await getPublic<Schemas["PublicPost"]>("posts", "posts");
  return items.map(publicPostFromApi);
}
