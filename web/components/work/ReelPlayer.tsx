"use client";

import Image from "next/image";
import { useState } from "react";
import type { Schemas } from "@/lib/api/client";

type Props = { videoUrl: string; description: string; preview: Schemas["PublicImage"] };

/** Turns a YouTube, Vimeo or Instagram link into its privacy-friendly embed URL. */
export function embedUrl(videoUrl: string): string | null {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^(www|m)\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}?autoplay=1`;
    if (host === "youtube.com") {
      const id = url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` : null;
    }
    if (host === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1` : null;
    }
    if (host === "instagram.com") {
      const path = url.pathname.replace(/\/$/, "");
      return `https://www.instagram.com${path}/embed`;
    }
  } catch {
    return null;
  }
  return null;
}

// Nothing is loaded from the video host until the visitor presses Play (005 T013), so the
// page stays fast and no third-party requests happen on page load.
export default function ReelPlayer({ videoUrl, description, preview }: Props) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = embedUrl(videoUrl);

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-surface">
        {playing && src && !failed ? (
          <iframe
            src={src}
            title={description}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full"
          />
        ) : (
          <>
            <Image src={preview.url} alt={preview.alt} fill sizes="(min-width: 1024px) 20rem, 90vw" className="object-cover" />
            {src && !failed ? (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/35"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="ml-1 size-7" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="sr-only">Play reel: {description}</span>
              </button>
            ) : (
              <p className="absolute inset-x-0 bottom-0 bg-black/70 p-3 text-sm text-white">This video is unavailable</p>
            )}
          </>
        )}
      </div>
      <figcaption className="text-sm text-muted">{description}</figcaption>
    </figure>
  );
}
