"use client";

import Link from "next/link";
import { useState } from "react";
import PublishBadge from "@/components/admin/content/PublishBadge";
import SortableList from "@/components/admin/content/SortableList";
import { useToast } from "@/components/ui/Toast";
import { reorderCaseStudies, type CaseStudyAdmin } from "@/lib/content/case-study-admin";
import { formatDateTime } from "@/lib/format";

const HREF = "/admin/content/case-studies";

export default function CaseStudyList({ initial }: { initial: CaseStudyAdmin[] }) {
  const [items, setItems] = useState(initial);
  const toast = useToast();

  async function handleReorder(ids: string[]) {
    const previous = items;
    const byId = new Map(items.map((item) => [item.id, item]));
    setItems(ids.flatMap((id) => byId.get(id) ?? []));
    try {
      await reorderCaseStudies(ids);
      toast("New order saved.");
    } catch {
      setItems(previous);
      toast("Couldn't save the new order, so it's been put back.", "error");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <Link href="/admin/content" className="text-sm font-medium text-muted hover:text-foreground">
        ← Content
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Case studies</h1>
          <p className="mt-1 text-muted">Published case studies appear on /work in this order. Drag or use the arrows to reorder.</p>
        </div>
        <Link href={`${HREF}/new`} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:brightness-95">
          New case study
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border px-6 py-16 text-center text-muted">No case studies yet.</p>
      ) : (
        <SortableList
          items={items}
          getLabel={(item) => item.client_name || item.slug}
          onReorder={handleReorder}
          className="mt-8 flex flex-col gap-2"
          renderItem={(item, handle) => (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-background p-3 sm:flex-nowrap sm:gap-4 sm:p-4">
              {handle}
              {item.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnail_url} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover max-[359px]:hidden" />
              ) : (
                <span aria-hidden="true" className="h-12 w-16 shrink-0 rounded-lg bg-surface max-[359px]:hidden" />
              )}
              <div className="min-w-0 flex-1 basis-32">
                <p className="truncate font-semibold">{item.client_name || "Untitled"}</p>
                <p className="truncate text-sm text-muted">{item.title || "No title yet"}</p>
                <p className="truncate text-xs text-muted">
                  /work/{item.slug} · Changed {formatDateTime(item.updated_at)}
                  {item.updated_by_name ? ` by ${item.updated_by_name}` : ""}
                </p>
              </div>
              <PublishBadge status={item.status === "published" ? "Published" : "Draft"} />
              <Link href={`${HREF}/${item.id}`} className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-surface">
                Edit<span className="sr-only"> {item.client_name}</span>
              </Link>
            </div>
          )}
        />
      )}
    </main>
  );
}
