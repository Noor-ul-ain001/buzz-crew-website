"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/blog/markdown";

// Sticky contents list for desktop. The section being read is marked with aria-current.
export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    // A heading counts as "current" once it passes the top fifth of the viewport.
    const observer = new IntersectionObserver(
      () => {
        const passed = elements.filter((element) => element.getBoundingClientRect().top < window.innerHeight * 0.2);
        setActiveId((passed.at(-1) ?? elements[0]).id);
      },
      { rootMargin: "0px 0px -80% 0px", threshold: [0, 1] },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-labelledby="toc-heading" className="sticky top-8">
      <h2 id="toc-heading" className="text-sm font-semibold uppercase tracking-wide text-muted">
        On this page
      </h2>
      <ol className="mt-4 flex flex-col gap-1 border-l border-border text-sm">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={activeId === heading.id ? "location" : undefined}
              className={`-ml-px block border-l-2 border-transparent py-1 text-muted hover:text-foreground aria-[current=location]:border-foreground aria-[current=location]:font-medium aria-[current=location]:text-foreground ${
                heading.level === 3 ? "pl-7" : "pl-4"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
