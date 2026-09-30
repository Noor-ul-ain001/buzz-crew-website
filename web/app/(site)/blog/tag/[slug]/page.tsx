import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostListing from "@/components/blog/PostListing";
import { getPostsWithTag, getTags, parsePage } from "@/lib/data/blog";
import { pageMetadata } from "@/lib/metadata";

export async function generateStaticParams() {
  return (await getTags()).map((tag) => ({ slug: tag.slug }));
}

async function findTag(slug: string) {
  return (await getTags()).find((tag) => tag.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/blog/tag/[slug]">): Promise<Metadata> {
  const tag = await findTag((await params).slug);
  if (!tag) return { title: "Tag not found" };
  return pageMetadata({
    title: `Posts tagged “${tag.name}”`,
    description: `Articles about ${tag.name} from The Buzz Crew blog.`,
    path: `/blog/tag/${tag.slug}`,
  });
}

export default async function BlogTagPage({ params, searchParams }: PageProps<"/blog/tag/[slug]">) {
  const tag = await findTag((await params).slug);
  if (!tag) notFound();
  const [posts, { page }] = await Promise.all([getPostsWithTag(tag.slug), searchParams]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/blog" className="text-sm font-medium text-muted hover:text-foreground">
        ← All posts
      </Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted">Tag</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{tag.name}</h1>
      <p className="mt-3 text-lg text-muted">
        {tag.count} {tag.count === 1 ? "post" : "posts"}
      </p>
      <PostListing posts={posts} page={parsePage(page)} basePath={`/blog/tag/${tag.slug}`} />
    </main>
  );
}
