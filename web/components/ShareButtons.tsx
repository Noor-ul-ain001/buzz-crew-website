"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const noSubscription = () => () => {};
// Only touch devices: desktop share sheets are less familiar than copying a link.
const deviceCanShare = () =>
  window.matchMedia("(pointer: coarse)").matches && typeof navigator.share === "function";

const buttonClass =
  "inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm font-medium hover:bg-surface";

// Shared by blog posts, audit reports and case studies. On phones with a share menu the
// first button opens it; elsewhere it copies the link and says so in a live region.
export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const canShare = useSyncExternalStore(noSubscription, deviceCanShare, () => false);

  useEffect(() => {
    if (copied === "idle") return;
    const timer = setTimeout(() => setCopied("idle"), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function shareOrCopy() {
    if (canShare) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  const linkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-semibold">Share</span>
      <button type="button" onClick={shareOrCopy} className={buttonClass}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
        </svg>
        {canShare ? "Share" : copied === "copied" ? "Link copied" : "Copy link"}
      </button>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={buttonClass}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
          <path d="M12.05 21.5h-.01a9.9 9.9 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.48-8.41" />
        </svg>
        WhatsApp<span className="sr-only"> (opens in a new tab)</span>
      </a>
      <a href={linkedIn} target="_blank" rel="noopener noreferrer" className={buttonClass}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
        </svg>
        LinkedIn<span className="sr-only"> (opens in a new tab)</span>
      </a>
      <span role="status" className="text-sm text-muted">
        {copied === "copied" && "Link copied to your clipboard."}
        {copied === "failed" && "Couldn't copy. Please copy the address from your browser."}
      </span>
    </div>
  );
}
