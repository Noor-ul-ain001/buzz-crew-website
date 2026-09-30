"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useContent } from "@/components/admin/content/ContentProvider";
import PublishBadge from "@/components/admin/content/PublishBadge";
import SortableList from "@/components/admin/content/SortableList";
import { useToast } from "@/components/ui/Toast";
import { PUBLISH_STATUSES, type PublishStatus, type TeamMember, type Testimonial } from "@/lib/content/types";
import { formatDateTime } from "@/lib/format";

type Kind = "testimonials" | "team";

const COPY: Record<Kind, { title: string; intro: string; noun: string; newLabel: string; href: string }> = {
  testimonials: {
    title: "Testimonials",
    intro: "Published testimonials appear in the homepage carousel in this order.",
    noun: "testimonial",
    newLabel: "New testimonial",
    href: "/admin/content/testimonials",
  },
  team: {
    title: "Team",
    intro: "Published team members appear on the About page in this order.",
    noun: "team member",
    newLabel: "New team member",
    href: "/admin/content/team",
  },
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ContentList({ kind }: { kind: Kind }) {
  const { reorder, ...content } = useContent(kind);
  const all: (Testimonial | TeamMember)[] = content.items;
  const toast = useToast();
  const copy = COPY[kind];
  // The filter lives in the URL so it survives a reload and can be shared.
  const param = useSearchParams().get("status");
  const filter = PUBLISH_STATUSES.find((status) => status.toLowerCase() === param) ?? null;
  const items = filter ? all.filter((item) => item.status === filter) : all;

  async function handleReorder(ids: string[]) {
    try {
      await reorder(ids);
      toast("New order saved.");
    } catch {
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
          <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
          <p className="mt-1 text-muted">
            {copy.intro} {filter ? "Show all items to reorder them." : "Drag the handle or use the arrows to reorder."}
          </p>
        </div>
        <Link href={`${copy.href}/new`} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:brightness-95">
          {copy.newLabel}
        </Link>
      </div>

      <nav aria-label="Filter by status" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {([null, ...PUBLISH_STATUSES] as (PublishStatus | null)[]).map((status) => (
            <li key={status ?? "all"}>
              <Link
                href={status ? `${copy.href}?status=${status.toLowerCase()}` : copy.href}
                aria-current={status === filter ? "page" : undefined}
                className="block rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background"
              >
                {status ?? "All"}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border px-6 py-16 text-center text-muted">
          {filter ? `No ${filter.toLowerCase()} ${copy.noun}s.` : `No ${copy.noun}s yet.`}
        </p>
      ) : filter ? (
        <ul className="mt-8 flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Row item={item} href={`${copy.href}/${item.id}`} handle={null} />
            </li>
          ))}
        </ul>
      ) : (
        <SortableList
          items={items}
          getLabel={(item) => item.name}
          onReorder={handleReorder}
          className="mt-8 flex flex-col gap-2"
          renderItem={(item, handle) => <Row item={item} href={`${copy.href}/${item.id}`} handle={handle} />}
        />
      )}
    </main>
  );
}

function Row({ item, href, handle }: { item: Testimonial | TeamMember; href: string; handle: ReactNode }) {
  const secondary =
    "company" in item ? [item.role, item.company, item.country].filter(Boolean).join(" · ") : item.role;
  const missingAlt = item.photo !== null && !item.photo.alt.trim();
  const thumbnail = item.thumbnailUrl ?? item.photo?.url;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 sm:gap-4 sm:p-4">
      {handle}
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt="" className="size-12 shrink-0 rounded-full bg-white object-cover" />
      ) : (
        <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold">
          {initials(item.name)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{item.name}</p>
        <p className="truncate text-sm text-muted">{secondary || "No details yet"}</p>
        {item.updatedAt && (
          <p className="truncate text-xs text-muted">
            Changed {formatDateTime(item.updatedAt)}
            {item.updatedByName ? ` by ${item.updatedByName}` : ""}
          </p>
        )}
        {missingAlt && <p className="text-xs font-medium text-danger">Photo needs alt text</p>}
      </div>
      <PublishBadge status={item.status} />
      <Link href={href} className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-surface">
        Edit<span className="sr-only"> {item.name}</span>
      </Link>
    </div>
  );
}
