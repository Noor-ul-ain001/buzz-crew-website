"use client";

type LoaderArgs = { src: string; width: number; quality?: number };

const UPLOAD_SEGMENT = "/image/upload/";

// Cloudinary resizes and picks the best format itself (free plan), so these images skip
// Vercel's optimiser. Local files in /public keep a width hint the browser can cache by.
export default function cloudinaryLoader({ src, width, quality }: LoaderArgs) {
  if (src.startsWith("https://res.cloudinary.com/") && src.includes(UPLOAD_SEGMENT)) {
    const transform = `f_auto,q_${quality ?? "auto"},c_limit,w_${width}`;
    return src.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}${transform}/`);
  }
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
