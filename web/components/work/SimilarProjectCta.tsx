"use client";

import { useEffect, useState } from "react";
import { useInquiry } from "@/components/inquiry/InquiryModalProvider";
import { track } from "@/lib/analytics";
import { SERVICE_LABELS, type ApiService } from "@/lib/content/work-labels";
import { WHATSAPP_URL } from "@/lib/site";

const SCROLL_THRESHOLD = 0.4;

/**
 * "Start a similar project" (005 US2): opens the inquiry form with this case study's
 * services ticked. `variant="sticky"` is a small bar on phones after 40% of the page.
 */
export default function SimilarProjectCta({
  services,
  slug,
  variant = "block",
}: {
  services: ApiService[];
  slug: string;
  variant?: "block" | "sticky";
}) {
  const inquiry = useInquiry();
  const [visible, setVisible] = useState(variant === "block");

  useEffect(() => {
    if (variant !== "sticky") return;
    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(scrollable > 0 && window.scrollY / scrollable >= SCROLL_THRESHOLD);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  function start() {
    track("similar_project_clicked", { case_study: slug });
    inquiry?.openInquiry({ services: services.map((service) => SERVICE_LABELS[service]) });
  }

  if (variant === "sticky") {
    if (!visible) return null;
    return (
      <div data-testid="sticky-cta" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <button type="button" onClick={start} className="w-full rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground">
          Start a similar project
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="similar-project" className="rounded-3xl bg-surface p-6 sm:p-10">
      <h2 id="similar-project" className="text-3xl sm:text-4xl">
        Want results like these?
      </h2>
      <p className="mt-2 max-w-xl text-muted">Tell us about your business and we&apos;ll reply within one working day.</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={start} className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground hover:brightness-95">
          Start a similar project
        </button>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-6 py-3 font-medium hover:bg-background">
          Message us on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </section>
  );
}
