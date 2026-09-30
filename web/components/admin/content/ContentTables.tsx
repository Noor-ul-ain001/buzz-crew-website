"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import AdminTable from "@/components/admin/content/AdminTable";
import { useContent } from "@/components/admin/content/ContentProvider";
import PublishBadge from "@/components/admin/content/PublishBadge";
import { categoryName } from "@/lib/blog/utils";
import { formatDate } from "@/lib/format";

function Page({ title, intro, action, children }: { title: string; intro: string; action?: ReactNode; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <Link href="/admin/content" className="text-sm font-medium text-muted hover:text-foreground">
        ← Content
      </Link>
      <div className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-muted">{intro}</p>
        </div>
        {action}
      </div>
      {children}
    </main>
  );
}

export function PostsTable() {
  const { items } = useContent("posts");
  // Drafts first (they need attention), then newest.
  const rows = [...items].sort(
    (a, b) => Number(a.status === "Published") - Number(b.status === "Published") || b.publishedAt.localeCompare(a.publishedAt),
  );

  return (
    <Page
      title="Blog posts"
      intro="Drafts first, then published posts, newest first."
      action={
        <Link href="/admin/content/posts/new" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:brightness-95">
          New post
        </Link>
      }
    >
      <AdminTable
        caption="Blog posts"
        rows={rows}
        titleHeader="Title"
        title={(post) => post.title}
        href={(post) => `/admin/content/posts/${post.id}`}
        columns={[
          { header: "Category", cell: (post) => categoryName(post.category), className: "whitespace-nowrap" },
          { header: "Author", cell: (post) => post.author.name, className: "whitespace-nowrap" },
          { header: "Status", cell: (post) => <PublishBadge status={post.status} /> },
          {
            header: "Published",
            cell: (post) => (post.status === "Published" ? formatDate(post.publishedAt) : "Not yet"),
            className: "whitespace-nowrap text-muted",
          },
        ]}
      />
    </Page>
  );
}

export function FaqsTable() {
  const { items } = useContent("faqs");
  return (
    <Page title="FAQs" intro="Questions shown on the FAQ page, in their groups.">
      <AdminTable
        caption="Frequently asked questions"
        rows={items}
        titleHeader="Question"
        title={(item) => item.question}
        columns={[
          { header: "Group", cell: (item) => item.group, className: "whitespace-nowrap" },
          { header: "Status", cell: (item) => <PublishBadge status={item.status} /> },
        ]}
      />
    </Page>
  );
}

