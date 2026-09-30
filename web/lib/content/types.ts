import type { LeadCountry } from "@/lib/leads/types";

export const PUBLISH_STATUSES = ["Draft", "Published"] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export type ImageAsset = {
  url: string;
  /** Required before the item can be published. Empty while the admin hasn't written it. */
  alt: string;
  /** Set once the image is stored by the API (feature 004). */
  mediaId?: string;
  /** The alt text as last saved, so only changed alt text is sent back. */
  savedAlt?: string;
  width?: number;
  height?: number;
};

type ContentBase = {
  id: string;
  status: PublishStatus;
  updatedAt: string;
  /** Optimistic-lock version from the API; absent for mock content. */
  version?: number;
  updatedByName?: string | null;
  thumbnailUrl?: string | null;
};

export type Testimonial = ContentBase & {
  name: string;
  role: string;
  company: string;
  country: LeadCountry | "";
  quote: string;
  photo: ImageAsset | null;
  /** Optional link to a video version (YouTube, Instagram, Vimeo). Empty when there is none. */
  videoUrl: string;
};

export type ClientLogo = ContentBase & {
  name: string;
  logo: ImageAsset | null;
  websiteUrl: string;
};

export type TeamMember = ContentBase & {
  name: string;
  role: string;
  bio: string;
  photo: ImageAsset | null;
};

export const BLOG_CATEGORIES = [
  { slug: "seo", name: "SEO", description: "Getting found on Google, in Karachi, Dubai and the UK." },
  { slug: "social-media", name: "Social Media", description: "Content, community and what actually works on Instagram." },
  { slug: "meta-ads", name: "Meta Ads", description: "Paid social that brings in enquiries, not just likes." },
  { slug: "web-development", name: "Web Development", description: "Fast, accessible websites that turn visitors into leads." },
] as const;

export type BlogCategorySlug = (typeof BLOG_CATEGORIES)[number]["slug"];

export type Author = {
  name: string;
  role: string;
  photo: ImageAsset | null;
};

export type BlogPost = ContentBase & {
  slug: string;
  title: string;
  excerpt: string;
  bodyMarkdown: string;
  cover: ImageAsset | null;
  author: Author;
  category: BlogCategorySlug;
  /** Display names, e.g. "Local SEO". The URL slug is derived with tagSlug(). */
  tags: string[];
  publishedAt: string;
  readingMinutes: number;
  /** Empty fields fall back to the title and excerpt. */
  seo: { metaTitle: string; metaDescription: string };
};

export type FaqItem = ContentBase & {
  group: string;
  question: string;
  answer: string;
};

export type ContentCollections = {
  testimonials: Testimonial;
  logos: ClientLogo;
  team: TeamMember;
  posts: BlogPost;
  faqs: FaqItem;
};

export type ContentKind = keyof ContentCollections;
