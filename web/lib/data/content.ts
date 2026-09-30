import type { ContentCollections } from "@/lib/content/types";
import { MOCK_FAQS } from "@/lib/data/mock-faqs";
import { MOCK_POSTS } from "@/lib/data/mock-posts";

// Mock content for the collections that don't have API endpoints yet: blog posts (007),
// FAQs (006). Testimonials, client logos and team members come from the API
// (lib/content/public.ts for the site, lib/content/admin-server.ts for the admin).

export type MockKind = "posts" | "faqs";

const MOCK_LATENCY_MS = 600;

const COLLECTIONS: { [K in MockKind]: ContentCollections[K][] } = {
  posts: MOCK_POSTS,
  faqs: MOCK_FAQS,
};

function delay() {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}

// Reads return copies so callers can't mutate the mock "database".
export async function getContent<K extends MockKind>(kind: K): Promise<ContentCollections[K][]> {
  return structuredClone(COLLECTIONS[kind]);
}

export async function getPublishedContent<K extends MockKind>(kind: K): Promise<ContentCollections[K][]> {
  return (await getContent(kind)).filter((item) => item.status === "Published");
}


// Writes are simulated: they wait, then succeed. Changes live in the admin session only
// (see ContentProvider) and don't reach the public site until the real API exists.
export async function saveContentItem<K extends MockKind>(kind: K, item: ContentCollections[K]) {
  void kind;
  await delay();
  return { ...item, updatedAt: new Date().toISOString() };
}

export async function saveContentOrder(kind: MockKind, ids: string[]) {
  void kind;
  void ids;
  await delay();
}
