import Image from "next/image";
import Link from "next/link";
import { categoryName, postPath } from "@/lib/blog/utils";
import type { BlogPost } from "@/lib/content/types";
import { formatLongDate } from "@/lib/format";

export function PostMeta({ post }: { post: BlogPost }) {
  return (
    <p className="text-sm text-muted">
      <time dateTime={post.publishedAt}>{formatLongDate(post.publishedAt)}</time>
      <span aria-hidden="true"> · </span>
      {post.readingMinutes} min read
    </p>
  );
}

export function PostCover({ post, priority = false, sizes }: { post: BlogPost; priority?: boolean; sizes: string }) {
  if (!post.cover) return <div aria-hidden="true" className="aspect-[1200/630] rounded-2xl bg-surface" />;
  return (
    <Image
      src={post.cover.url}
      alt={post.cover.alt}
      width={1200}
      height={630}
      sizes={sizes}
      priority={priority}
      // Mock covers are SVGs, which next/image doesn't optimise. Drop this for real photos.
      unoptimized={post.cover.url.endsWith(".svg")}
      className="aspect-[1200/630] w-full rounded-2xl object-cover"
    />
  );
}

// The title link covers the whole card; the category is plain text so there's only one
// link per card for keyboard and screen reader users.
export default function PostCard({ post, headingLevel = "h2" }: { post: BlogPost; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex h-full flex-col gap-4 rounded-3xl border border-border bg-background p-4">
      <PostCover post={post} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" />
      <div className="flex flex-1 flex-col gap-3 px-1 pb-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{categoryName(post.category)}</p>
        <Heading className="text-xl font-semibold tracking-tight">
          <Link href={postPath(post.slug)} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
            {post.title}
          </Link>
        </Heading>
        <p className="line-clamp-3 text-muted">{post.excerpt}</p>
        {post.tags.length > 0 && (
          <ul aria-label="Topics" className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.slice(0, 3).map((tag) => (
              <li key={tag} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-muted">
                {tag}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium">{post.author.name}</p>
            <PostMeta post={post} />
          </div>
          <span aria-hidden="true" className="shrink-0 text-sm font-semibold text-accent-strong transition-transform motion-safe:group-hover:translate-x-1">
            Read article →
          </span>
        </div>
      </div>
    </article>
  );
}

export function FeaturedPost({ post }: { post: BlogPost }) {
  return (
    <article className="group relative grid items-center gap-6 lg:grid-cols-[1.3fr_1fr] lg:gap-10">
      <PostCover post={post} priority sizes="(min-width: 1024px) 640px, 100vw" />
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">
          <span className="rounded-full bg-accent px-2.5 py-1 text-accent-foreground">Latest</span>
          <span className="ml-3 uppercase tracking-wide text-muted">{categoryName(post.category)}</span>
        </p>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <Link href={postPath(post.slug)} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
            {post.title}
          </Link>
        </h2>
        <p className="text-lg text-muted">{post.excerpt}</p>
        {post.tags.length > 0 && (
          <ul aria-label="Topics" className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.slice(0, 3).map((tag) => (
              <li key={tag} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-muted">
                {tag}
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-3 pt-2">
          {post.author.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.photo.url} alt="" width={40} height={40} className="size-10 rounded-full" />
          )}
          <div>
            <p className="text-sm font-medium">{post.author.name}</p>
            <PostMeta post={post} />
          </div>
        </div>
      </div>
    </article>
  );
}
