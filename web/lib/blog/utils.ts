import { slug } from "github-slugger";
import { BLOG_CATEGORIES, type BlogCategorySlug } from "@/lib/content/types";

export function tagSlug(tag: string) {
  return slug(tag);
}

export function categoryName(slug: BlogCategorySlug) {
  return BLOG_CATEGORIES.find((category) => category.slug === slug)?.name ?? slug;
}

export function postPath(slug: string) {
  return `/blog/${slug}`;
}
