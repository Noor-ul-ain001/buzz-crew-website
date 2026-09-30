"use client";

import Link from "next/link";
import { useDeferredValue, useId, useState } from "react";
import type { FaqItem } from "@/lib/content/types";

function matches(item: FaqItem, words: string[]) {
  const text = `${item.question} ${item.answer}`.toLowerCase();
  return words.every((word) => text.includes(word));
}

// Grouped accordion built on <details>, so it works before JavaScript loads and with
// any assistive tech. While searching, every matching answer is shown open.
export default function FaqSearch({ groups }: { groups: { name: string; items: FaqItem[] }[] }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const searchId = useId();
  const words = deferred.toLowerCase().split(/\s+/).filter(Boolean);
  const searching = words.length > 0;

  const filtered = groups
    .map((group) => ({ ...group, items: searching ? group.items.filter((item) => matches(item, words)) : group.items }))
    .filter((group) => group.items.length > 0);
  const total = filtered.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="mt-10">
      <div role="search" className="max-w-xl">
        <label htmlFor={searchId} className="text-sm font-medium">
          Search the questions
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. pricing, Arabic, contract"
          autoComplete="off"
          className="mt-1.5 block w-full rounded-full border border-border bg-background px-5 py-3 text-base focus:border-foreground focus:outline-none"
        />
        <p role="status" className="mt-2 text-sm text-muted">
          {searching && (total === 0 ? "No questions match your search." : `${total} ${total === 1 ? "question matches" : "questions match"} your search.`)}
        </p>
      </div>

      {total === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="font-semibold">We couldn&apos;t find that one.</p>
          <p className="mt-1 text-muted">
            Ask us directly on the <Link href="/contact" className="font-medium text-foreground underline underline-offset-4">contact page</Link> and we&apos;ll reply within 24 hours.
          </p>
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-12">
          {filtered.map((group, index) => (
            <section key={group.name} aria-labelledby={`${searchId}-group-${index}`}>
              <h2 id={`${searchId}-group-${index}`} className="text-2xl font-bold tracking-tight">
                {group.name}
              </h2>
              <div className="mt-4 divide-y divide-border border-y border-border">
                {group.items.map((item) => (
                  // Re-keyed when a search starts or ends, so matches open and close together.
                  <details key={`${item.id}-${searching}`} open={searching} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-medium [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="max-w-3xl pb-6 leading-relaxed text-muted">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
