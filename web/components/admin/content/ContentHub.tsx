"use client";

import Link from "next/link";
import { useAllContent } from "@/components/admin/content/ContentProvider";
import type { ContentKind, PublishStatus } from "@/lib/content/types";

const SECTIONS: { kind: ContentKind; title: string; description: string; href: string }[] = [
  {
    kind: "posts",
    title: "Blog posts",
    description: "Articles for the blog, written in Markdown.",
    href: "/admin/content/posts",
  },
  {
    kind: "testimonials",
    title: "Testimonials",
    description: "Client quotes for the homepage carousel.",
    href: "/admin/content/testimonials",
  },
  {
    kind: "logos",
    title: "Client logos",
    description: "Logos that scroll across the homepage.",
    href: "/admin/content/logos",
  },
  {
    kind: "team",
    title: "Team",
    description: "The crew, as shown on the About page.",
    href: "/admin/content/team",
  },
  {
    kind: "faqs",
    title: "FAQs",
    description: "Questions and answers on the FAQ page.",
    href: "/admin/content/faqs",
  },
];

function count(items: { status: PublishStatus }[], status: PublishStatus) {
  return items.filter((item) => item.status === status).length;
}

export default function ContentHub() {
  const collections = useAllContent();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-3xl font-bold tracking-tight">Content</h1>
      <p className="mt-1 text-muted">Manage what appears on the public site.</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => {
          const items = collections[section.kind];
          const drafts = count(items, "Draft");
          return (
            <li key={section.kind}>
              <Link
                href={section.href}
                className="group flex h-full flex-col rounded-2xl border border-border p-6 hover:border-foreground"
              >
                <h2 className="text-xl font-semibold tracking-tight">
                  {section.title}{" "}
                  <span aria-hidden="true" className="inline-block transition-transform motion-safe:group-hover:translate-x-1">
                    →
                  </span>
                </h2>
                <p className="mt-1 text-sm text-muted">{section.description}</p>
                <p className="mt-6 text-sm">
                  <strong>{count(items, "Published")}</strong> published
                  {drafts > 0 && (
                    <>
                      {" · "}
                      <strong>{drafts}</strong> {drafts === 1 ? "draft" : "drafts"}
                    </>
                  )}
                </p>
              </Link>
            </li>
          );
        })}
        <li>
          {/* Case studies (005) load their own list, so no counts here. */}
          <Link href="/admin/content/case-studies" className="group flex h-full flex-col rounded-2xl border border-border p-6 hover:border-foreground">
            <h2 className="text-xl font-semibold tracking-tight">
              Case studies{" "}
              <span aria-hidden="true" className="inline-block transition-transform motion-safe:group-hover:translate-x-1">
                →
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted">Client results for the /work pages.</p>
          </Link>
        </li>
      </ul>
    </main>
  );
}
