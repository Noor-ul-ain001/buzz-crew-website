import { tagSlug } from "@/lib/blog/utils";
import { BLOG_CATEGORIES, type BlogCategorySlug, type BlogPost } from "@/lib/content/types";
import { getPublishedContent } from "@/lib/data/content";

// Blog queries for the public site, built on the shared mock content API.

export const POSTS_PER_PAGE = 6;

/** Published posts, newest first. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getPublishedContent("posts");
  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  return (await getPublishedPosts()).find((post) => post.slug === slug);
}

export function getCategory(slug: string) {
  return BLOG_CATEGORIES.find((category) => category.slug === slug);
}

export async function getPostsInCategory(slug: BlogCategorySlug) {
  return (await getPublishedPosts()).filter((post) => post.category === slug);
}

/** Every tag used by a published post, with its URL slug and post count. */
export async function getTags(): Promise<{ name: string; slug: string; count: number }[]> {
  const tags = new Map<string, { name: string; slug: string; count: number }>();
  for (const post of await getPublishedPosts()) {
    for (const name of post.tags) {
      const slug = tagSlug(name);
      const existing = tags.get(slug);
      tags.set(slug, { name: existing?.name ?? name, slug, count: (existing?.count ?? 0) + 1 });
    }
  }
  return [...tags.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getPostsWithTag(slug: string) {
  return (await getPublishedPosts()).filter((post) => post.tags.some((tag) => tagSlug(tag) === slug));
}

// Same category first, then most shared tags, then newest.
export async function getRelatedPosts(post: BlogPost, count = 3): Promise<BlogPost[]> {
  const tags = new Set(post.tags.map(tagSlug));
  const score = (other: BlogPost) =>
    (other.category === post.category ? 10 : 0) + other.tags.filter((tag) => tags.has(tagSlug(tag))).length;
  return (await getPublishedPosts())
    .filter((other) => other.id !== post.id)
    .sort((a, b) => score(b) - score(a) || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, count);
}

export function paginate<T>(items: T[], page: number, perPage = POSTS_PER_PAGE) {
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    items: items.slice((current - 1) * perPage, current * perPage),
    page: current,
    pageCount,
  };
}

export function parsePage(value: string | string[] | undefined) {
  const page = Number.parseInt(Array.isArray(value) ? value[0] : (value ?? "1"), 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}
