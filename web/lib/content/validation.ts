import { z } from "zod";
import { BLOG_CATEGORIES, type BlogCategorySlug, type ImageAsset } from "@/lib/content/types";
import { COUNTRIES } from "@/lib/validation/inquiry";

// Drafts only need a name, so work can be saved part-way. Publishing needs everything the
// public site shows, and alt text on every image.

const imageSchema = z
  .object({
    url: z.string(),
    alt: z.string().max(150, "Keep the alt text under 150 characters."),
    mediaId: z.string().optional(),
    savedAlt: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .nullable();

const name = z.string().trim().min(1, "Enter a name.").max(100, "Keep the name under 100 characters.");
const text = (label: string, max: number) =>
  z.string().trim().max(max, `Keep the ${label} under ${max} characters.`);
const required = (label: string, max: number) => text(label, max).min(1, `Enter the ${label}.`);

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https:\/\/\S+\.\S+/.test(value), "Enter a full link starting with https://");

// Same list as the API: a link anywhere else is refused.
const VIDEO_HOSTS = ["youtube.com", "youtu.be", "vimeo.com", "instagram.com"];

function videoHostAllowed(value: string) {
  try {
    const host = new URL(value).hostname.replace(/^(www|m)\./, "");
    return VIDEO_HOSTS.includes(host);
  } catch {
    return false;
  }
}

const videoUrl = optionalUrl.refine(
  (value) => value === "" || videoHostAllowed(value),
  "Accepted links: YouTube, Vimeo, Instagram",
);

export const testimonialDraftSchema = z.object({
  name,
  role: text("role", 100),
  company: text("company", 100),
  country: z.union([z.enum(COUNTRIES), z.literal("")]),
  quote: text("quote", 400),
  photo: imageSchema,
  videoUrl,
});

export const testimonialPublishSchema = testimonialDraftSchema.extend({
  role: required("role", 100),
  company: required("company", 100),
  country: z.enum(COUNTRIES, "Choose a country."),
  quote: required("quote", 400).min(20, "Quote must be at least 20 characters."),
});

export type TestimonialFormValues = z.input<typeof testimonialDraftSchema>;

export const teamDraftSchema = z.object({
  name,
  role: text("role", 100),
  bio: text("bio", 300),
  photo: imageSchema,
});

export const teamPublishSchema = teamDraftSchema.extend({
  role: required("role", 100),
  bio: required("bio", 300),
  photo: imageSchema.refine((photo) => photo !== null, "Add a photo."),
});

export type TeamFormValues = z.input<typeof teamDraftSchema>;

export const clientLogoSchema = z.object({
  name,
  logo: imageSchema,
  websiteUrl: optionalUrl,
});

export type ClientLogoFormValues = z.input<typeof clientLogoSchema>;

/** Why publishing is blocked by images, or null if every image is uploaded and has alt text. */
export function altTextBlocker(images: { label: string; image: ImageAsset | null }[]): string | null {
  const uploading = images.filter(({ image }) => image && !image.mediaId && image.url.startsWith("blob:"));
  if (uploading.length > 0) return `Wait for the ${uploading.map(({ label }) => label).join(" and ")} to finish uploading.`;
  const missing = images.filter(({ image }) => image && !image.alt.trim()).map(({ label }) => label);
  if (missing.length === 0) return null;
  return `Add alt text to the ${missing.join(" and ")} before publishing.`;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORY_SLUGS = BLOG_CATEGORIES.map((category) => category.slug) as [BlogCategorySlug, ...BlogCategorySlug[]];

export const postDraftSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(120, "Keep the title under 120 characters."),
  slug: z
    .string()
    .trim()
    .max(80, "Keep the URL under 80 characters.")
    .refine((value) => value === "" || SLUG_PATTERN.test(value), "Use lowercase letters, numbers and hyphens only, e.g. local-seo-tips."),
  excerpt: text("excerpt", 300),
  // "" is the form's "Choose a category" option; drafts need a category too.
  category: z
    .union([z.enum(CATEGORY_SLUGS), z.literal("")])
    .refine((value): value is BlogCategorySlug => value !== "", "Choose a category."),
  tags: z.array(z.string()).max(6, "Use up to six tags."),
  authorName: z.string(),
  cover: imageSchema,
  bodyMarkdown: z.string(),
  metaTitle: text("meta title", 70),
  metaDescription: text("meta description", 170),
});

export const postPublishSchema = postDraftSchema.extend({
  slug: z.string().trim().min(1, "Enter a URL slug.").regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens only, e.g. local-seo-tips."),
  excerpt: required("excerpt", 300).min(40, "The excerpt needs at least 40 characters."),
  authorName: z.string().min(1, "Choose an author."),
  bodyMarkdown: z.string().trim().min(200, "The post needs at least 200 characters before it can be published."),
});

export type PostFormValues = z.input<typeof postDraftSchema>;
