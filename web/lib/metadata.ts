import type { Metadata } from "next";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

// Per-page metadata. `title` fills the root layout's "%s | The Buzz Crew" template.
// Open Graph is spelled out in full because a page's `openGraph` replaces the layout's
// rather than merging with it, which also drops the image from app/opengraph-image.tsx
// unless it is listed again here.
// Pass `article` for blog posts to describe them as Open Graph articles.
export function pageMetadata({
  title,
  description,
  path,
  article,
}: {
  title: string;
  description: string;
  path: `/${string}`;
  article?: { publishedTime: string; modifiedTime?: string; authors: string[]; section: string; tags: string[] };
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_GB",
      // Articles get their image from their own opengraph-image file, which an explicit
      // `images` here would override.
      ...(article ? { type: "article" as const, ...article } : { type: "website" as const, images: DEFAULT_IMAGES }),
    },
  };
}

const DEFAULT_IMAGES = [
  {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: `${SITE_NAME}: ${SITE_TAGLINE}`,
  },
];
