"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { setConsent, useConsent, useConsentSettingsOpen } from "@/lib/consent";

// Non-modal banner: the page stays usable while it is shown. Accept and Reject are given
// equal weight, as UK guidance (ICO/PECR) expects.
export default function CookieBanner() {
  const consent = useConsent();
  const settingsOpen = useConsentSettingsOpen();
  const headingId = useId();
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Opened from the footer link: move focus into the banner so keyboard users land on it.
  useEffect(() => {
    if (settingsOpen) firstButtonRef.current?.focus();
  }, [settingsOpen]);

  if (consent === "loading" || (consent !== "unset" && !settingsOpen)) return null;

  const buttonClass = "flex-1 rounded-full px-5 py-2.5 text-sm font-semibold sm:flex-none";

  return (
    <section
      aria-labelledby={headingId}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-md sm:rounded-2xl sm:border sm:p-5"
    >
      <h2 id={headingId} className="font-semibold">
        Cookies on this site
      </h2>
      <p className="mt-1 text-sm text-muted">
        We&apos;d like to use analytics and advertising cookies (including the Meta Pixel) to
        measure our campaigns. They only load if you accept.{" "}
        <Link href="/privacy#cookies" className="font-medium text-foreground underline">
          Read more
        </Link>
      </p>
      {settingsOpen && consent !== "unset" && (
        <p className="mt-2 text-sm text-muted">
          Current choice: <strong className="text-foreground">{consent === "granted" ? "Accepted" : "Rejected"}</strong>
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <button
          ref={firstButtonRef}
          type="button"
          onClick={() => setConsent("denied")}
          className={`${buttonClass} border border-foreground hover:bg-surface`}
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => setConsent("granted")}
          className={`${buttonClass} border border-foreground bg-foreground text-background hover:opacity-90`}
        >
          Accept
        </button>
      </div>
    </section>
  );
}
