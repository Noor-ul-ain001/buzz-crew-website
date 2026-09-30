import type { MetadataRoute } from "next";
import { getCaseStudySlugs } from "@/lib/content/case-studies";
import { BLOG_CATEGORIES } from "@/lib/content/types";
import { getPublishedPosts, getTags } from "@/lib/data/blog";
import { getIndustries } from "@/lib/data/industries";
import { SITE_URL } from "@/lib/site";

type Entry = MetadataRoute.Sitemap[number];

const STATIC_ROUTES: { path: string; changeFrequency: Entry["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/services", changeFrequency: "monthly", priority: 0.9 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/work", changeFrequency: "weekly", priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/tools/seo-audit", changeFrequency: "monthly", priority: 0.7 },
  { path: "/tools/captions", changeFrequency: "monthly", priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

function entry(path: string, changeFrequency: Entry["changeFrequency"], priority: number, lastModified?: string): Entry {
  return { url: new URL(path, SITE_URL).toString(), changeFrequency, priority, ...(lastModified ? { lastModified } : {}) };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [caseStudies, posts, tags, industries] = await Promise.all([
    getCaseStudySlugs(),
    getPublishedPosts(),
    getTags(),
    getIndustries(),
  ]);

  return [
    ...STATIC_ROUTES.map(({ path, changeFrequency, priority }) => entry(path, changeFrequency, priority)),
    ...caseStudies.map((item) => entry(`/work/${item.slug}`, "monthly", 0.7, item.updated_at)),
    ...posts.map((post) => entry(`/blog/${post.slug}`, "monthly", 0.7, post.updatedAt)),
    ...BLOG_CATEGORIES.map((category) => entry(`/blog/category/${category.slug}`, "weekly", 0.5)),
    ...tags.map((tag) => entry(`/blog/tag/${tag.slug}`, "weekly", 0.3)),
    ...industries.map((industry) => entry(`/industries/${industry.slug}`, "monthly", 0.7)),
  ];
}
