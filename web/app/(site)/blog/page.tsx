import CategoryTabs from "@/components/blog/CategoryTabs";
import PostListing from "@/components/blog/PostListing";
import { getPublishedPosts, parsePage } from "@/lib/data/blog";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Blog",
  description:
    "Practical advice on SEO, social media, Meta Ads and websites for businesses in Pakistan, the UAE and the UK, from The Buzz Crew.",
  path: "/blog",
});

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const [posts, { page }] = await Promise.all([getPublishedPosts(), searchParams]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">The Buzz Crew blog</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        What we&apos;re learning from running SEO, social media, ads and websites for brands in Pakistan, the UAE and the UK.
      </p>
      <p className="mt-5 text-sm text-muted">Every article includes its author, reading time and key topics to help you find the right guide quickly.</p>
      <div className="mt-8">
        <CategoryTabs active={null} />
      </div>
      <PostListing posts={posts} page={parsePage(page)} basePath="/blog" featureLatest />
    </main>
  );
}
