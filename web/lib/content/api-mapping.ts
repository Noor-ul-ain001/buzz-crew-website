import type { Schemas } from "@/lib/api/client";
import type { BlogCategorySlug, BlogPost, ClientLogo, FaqItem, ImageAsset, PublishStatus, TeamMember, Testimonial } from "@/lib/content/types";
import type { LeadCountry } from "@/lib/leads/types";
import { COUNTRY_TO_API } from "@/lib/validation/enum-map";

// The API speaks snake_case and lowercase enums; the admin screens and public components
// use the shapes in lib/content/types.ts. These functions translate both ways.

type ApiCountry = Schemas["Country"];

const COUNTRY_FROM_API: Record<ApiCountry, LeadCountry> = {
  pakistan: "Pakistan",
  uae: "UAE",
  uk: "UK",
  other: "Other",
};

export function countryFromApi(country: ApiCountry | null | undefined): LeadCountry | "" {
  return country ? COUNTRY_FROM_API[country] : "";
}

export function countryToApi(country: LeadCountry | ""): ApiCountry | null {
  return country ? COUNTRY_TO_API[country] : null;
}

export function statusFromApi(status: Schemas["PublishStatus"]): PublishStatus {
  return status === "published" ? "Published" : "Draft";
}

export function imageFromApi(media: Schemas["MediaOut"] | null | undefined): ImageAsset | null {
  if (!media) return null;
  const alt = media.alt_text ?? "";
  return { url: media.url, alt, savedAlt: alt, mediaId: media.id, width: media.width, height: media.height };
}

export function publicImage(image: Schemas["PublicImage"] | null | undefined): ImageAsset | null {
  if (!image) return null;
  return { url: image.url, alt: image.alt, width: image.width, height: image.height };
}

type AdminItem = Schemas["TestimonialAdmin"] | Schemas["ClientLogoAdmin"] | Schemas["TeamMemberAdmin"] | Schemas["FaqAdmin"] | Schemas["PostAdmin"];

function meta(item: AdminItem) {
  return {
    id: item.id,
    status: statusFromApi(item.status),
    updatedAt: item.updated_at,
    version: item.version,
    updatedByName: item.updated_by_name ?? null,
    thumbnailUrl: item.thumbnail_url ?? null,
  };
}

export function testimonialFromApi(item: Schemas["TestimonialAdmin"]): Testimonial {
  return {
    ...meta(item),
    name: item.name,
    role: item.role,
    company: item.company,
    country: countryFromApi(item.country),
    quote: item.quote,
    photo: imageFromApi(item.photo),
    videoUrl: item.video_url ?? "",
  };
}

export function clientLogoFromApi(item: Schemas["ClientLogoAdmin"]): ClientLogo {
  return { ...meta(item), name: item.name, logo: imageFromApi(item.logo), websiteUrl: item.website_url ?? "" };
}

export function teamMemberFromApi(item: Schemas["TeamMemberAdmin"]): TeamMember {
  return { ...meta(item), name: item.name, role: item.role, bio: item.bio, photo: imageFromApi(item.photo) };
}

export function publicTestimonialFromApi(item: Schemas["PublicTestimonial"]): Testimonial {
  return {
    id: item.id,
    status: "Published",
    updatedAt: "",
    name: item.name,
    role: item.role,
    company: item.company,
    country: countryFromApi(item.country),
    quote: item.quote,
    photo: publicImage(item.photo),
    videoUrl: item.video_url ?? "",
  };
}

export function publicClientLogoFromApi(item: Schemas["PublicClientLogo"]): ClientLogo {
  return {
    id: item.id,
    status: "Published",
    updatedAt: "",
    name: item.name,
    logo: publicImage(item.logo),
    websiteUrl: item.website_url ?? "",
  };
}

export function publicTeamMemberFromApi(item: Schemas["PublicTeamMember"]): TeamMember {
  return {
    id: item.id,
    status: "Published",
    updatedAt: "",
    name: item.name,
    role: item.role,
    bio: item.bio,
    photo: publicImage(item.photo),
  };
}

export function faqFromApi(item: Schemas["FaqAdmin"]): FaqItem {
  return { ...meta(item), group: item.group, question: item.question, answer: item.answer };
}

export function publicFaqFromApi(item: Schemas["PublicFaq"]): FaqItem {
  return { id: item.id, status: "Published", updatedAt: "", group: item.group, question: item.question, answer: item.answer };
}

export function postFromApi(item: Schemas["PostAdmin"]): BlogPost {
  return {
    ...meta(item),
    slug: item.slug ?? "",
    title: item.title,
    excerpt: item.excerpt,
    bodyMarkdown: item.body_md,
    cover: imageFromApi(item.cover),
    author: { name: item.author_name, role: item.author_role, photo: null },
    category: item.category as BlogCategorySlug,
    tags: item.tags,
    // Drafts have no publish date yet; the editor sets one when publishing.
    publishedAt: item.published_at ?? item.updated_at,
    readingMinutes: item.reading_minutes,
    seo: { metaTitle: item.seo_title, metaDescription: item.seo_description },
  };
}

export function publicPostFromApi(item: Schemas["PublicPost"]): BlogPost {
  return {
    id: item.id,
    status: "Published",
    updatedAt: item.updated_at,
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt,
    bodyMarkdown: item.body_md,
    cover: publicImage(item.cover),
    author: { name: item.author_name, role: item.author_role, photo: null },
    category: item.category as BlogCategorySlug,
    tags: item.tags,
    publishedAt: item.published_at ?? item.updated_at,
    readingMinutes: item.reading_minutes,
    seo: { metaTitle: item.seo_title, metaDescription: item.seo_description },
  };
}
