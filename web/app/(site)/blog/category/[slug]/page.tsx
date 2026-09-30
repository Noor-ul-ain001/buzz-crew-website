import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryTabs from "@/components/blog/CategoryTabs";
import PostListing from "@/components/blog/PostListing";
import { BLOG_CATEGORIES } from "@/lib/content/types";
import { getCategory, getPostsInCategory, parsePage } from "@/lib/data/blog";
import { pageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
  return BLOG_CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/category/[slug]">): Promise<Metadata> {
  const category = getCategory((await params).slug);
  if (!category) return { title: "Category not found" };
  return pageMetadata({
    title: `${category.name} articles`,
    description: `${category.description} Articles from The Buzz Crew blog.`,
    path: `/blog/category/${category.slug}`,
  });
}

export default async function BlogCategoryPage({ params, searchParams }: PageProps<"/blog/category/[slug]">) {
  const category = getCategory((await params).slug);
  if (!category) notFound();
  const [posts, { page }] = await Promise.all([getPostsInCategory(category.slug), searchParams]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">Blog category</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{category.name}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{category.description}</p>
      <div className="mt-8">
        <CategoryTabs active={category.slug} />
      </div>
      <PostListing posts={posts} page={parsePage(page)} basePath={`/blog/category/${category.slug}`} />
    </main>
  );
}
