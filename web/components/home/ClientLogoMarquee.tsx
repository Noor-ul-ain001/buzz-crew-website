"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import type { ClientLogo } from "@/lib/content/types";

const SECONDS_PER_LOGO = 4;

// Scrolls continuously, pauses on hover or keyboard focus, and has a Pause button (WCAG
// 2.2.2). With reduced motion it doesn't move at all: the logos sit in a wrapped row.
// The list is rendered twice so the loop is seamless; the copy is hidden from assistive tech.
export default function ClientLogoMarquee({ logos }: { logos: ClientLogo[] }) {
  const [paused, setPaused] = useState(false);
  const shown = logos.filter((item) => item.logo);
  if (shown.length === 0) return null;

  const list = (copy: boolean) => (
    <ul
      aria-hidden={copy || undefined}
      className={`flex shrink-0 items-center gap-5 pr-5 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-4 motion-reduce:pr-0 ${
        copy ? "motion-reduce:hidden" : ""
      }`}
    >
      {shown.map((item) => (
        <li key={item.id} className="shrink-0">
          {/* Client logos come in every colour and background, so each sits on a white tile. */}
          <span className="flex h-24 w-36 items-center justify-center rounded-2xl bg-white p-3 shadow-sm">
            <Image
              src={item.logo!.url}
              alt={copy ? "" : item.logo!.alt}
              width={144}
              height={96}
              className="max-h-full w-auto object-contain"
            />
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="group relative">
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:[mask-image:none]">
        <div
          style={{ "--marquee-duration": `${shown.length * SECONDS_PER_LOGO}s` } as CSSProperties}
          className={`flex w-max motion-safe:animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:w-full ${
            paused ? "[animation-play-state:paused]" : ""
          }`}
        >
          {list(false)}
          {list(true)}
        </div>
      </div>
      <div className="mt-4 flex justify-center motion-reduce:hidden">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:bg-surface"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
            {paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
          </svg>
          {paused ? "Play" : "Pause"} logo animation
        </button>
      </div>
    </div>
  );
}
