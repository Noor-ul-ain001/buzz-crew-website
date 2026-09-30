import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "@/components/blog/Markdown";
import PostCard, { PostCover, PostMeta } from "@/components/blog/PostCard";
import ShareButtons from "@/components/ShareButtons";
import TableOfContents from "@/components/blog/TableOfContents";
import CtaBand from "@/components/CtaBand";
import { extractHeadings } from "@/lib/blog/markdown";
import { categoryName, postPath, tagSlug } from "@/lib/blog/utils";
import { getPostBySlug, getPublishedPosts, getRelatedPosts } from "@/lib/data/blog";
import { pageMetadata } from "@/lib/metadata";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateStaticParams() {
  return (await getPublishedPosts()).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug);
  if (!post) return { title: "Post not found" };
  return pageMetadata({
    title: post.seo.metaTitle || post.title,
    description: post.seo.metaDescription || post.excerpt,
    path: postPath(post.slug) as `/${string}`,
    article: {
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      section: categoryName(post.category),
      tags: post.tags,
    },
  });
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = await getPostBySlug((await params).slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post);
  const headings = extractHeadings(post.bodyMarkdown);
  const url = new URL(postPath(post.slug), SITE_URL).toString();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author.name },
    publisher: { "@type": "Organization", name: SITE_NAME },
    image: post.cover ? new URL(post.cover.url, SITE_URL).toString() : undefined,
    mainEntityOfPage: url,
  };

  return (
    <>
      <main className="flex-1">
        <script
          type="application/ld+json"
          // Escape "<" so post content can never close the script tag early.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <article>
          <header className="mx-auto w-full max-w-3xl px-4 pt-12 sm:px-6 sm:pt-16">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <li>
                  <Link href="/blog" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={`/blog/category/${post.category}`} className="hover:text-foreground">
                    {categoryName(post.category)}
                  </Link>
                </li>
              </ol>
            </nav>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">{post.title}</h1>
            <p className="mt-4 text-xl text-muted">{post.excerpt}</p>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
              <div className="flex items-center gap-3">
                {post.author.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.author.photo.url} alt="" width={48} height={48} className="size-12 rounded-full" />
                )}
                <div>
                  <p className="font-medium">
                    {post.author.name}
                    <span className="font-normal text-muted">, {post.author.role}</span>
                  </p>
                  <PostMeta post={post} />
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto mt-10 w-full max-w-5xl px-4 sm:px-6">
            <PostCover post={post} priority sizes="(min-width: 1024px) 1024px, 100vw" />
          </div>

          <div className="mx-auto mt-12 grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="mx-auto w-full max-w-3xl">
              <Markdown markdown={post.bodyMarkdown} className="sm:prose-lg" />

              <footer className="mt-12 flex flex-col gap-6 border-t border-border pt-8">
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-sm font-semibold">Tags</span>
                    <ul className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <li key={tag}>
                          <Link
                            href={`/blog/tag/${tagSlug(tag)}`}
                            className="inline-block rounded-full bg-surface px-3 py-1.5 text-sm font-medium hover:bg-border"
                          >
                            {tag}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <ShareButtons url={url} title={post.title} />
              </footer>
            </div>
            <aside className="hidden lg:block">
              <TableOfContents headings={headings} />
            </aside>
          </div>
        </article>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mx-auto mt-20 w-full max-w-6xl px-4 pb-20 sm:px-6">
            <h2 id="related-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Keep reading
            </h2>
            <ul className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <PostCard post={item} headingLevel="h3" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <CtaBand heading="Want results like these for your business?" />
    </>
  );
}
