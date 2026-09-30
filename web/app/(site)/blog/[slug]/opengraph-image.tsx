import { ImageResponse } from "next/og";
import { categoryName } from "@/lib/blog/utils";
import { getPostBySlug } from "@/lib/data/blog";
import { logoMarkDataUrl } from "@/lib/og";
import { BRAND_COLORS, SITE_NAME } from "@/lib/site";

// Social share image per post: brand layout with the post title and category.
export const alt = "Blog post from The Buzz Crew";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PostOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPostBySlug((await params).slug);
  const title = post?.title ?? SITE_NAME;
  const mark = await logoMarkDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: BRAND_COLORS.ink,
          color: BRAND_COLORS.paper,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* next/image isn't available inside ImageResponse. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={70} height={64} alt="" />
          <div style={{ fontSize: 36, fontWeight: 700 }}>{`${SITE_NAME} blog`}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {post && (
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: BRAND_COLORS.yellow, textTransform: "uppercase", letterSpacing: 2 }}>
              {categoryName(post.category)}
            </div>
          )}
          <div style={{ fontSize: title.length > 60 ? 60 : 72, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>{title}</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#d4d4d8" }}>
          {post ? `${post.author.name} · ${post.readingMinutes} min read` : ""}
        </div>
      </div>
    ),
    size,
  );
}
