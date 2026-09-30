import Link from "next/link";

// Shown when a lead id doesn't exist (notFound() in app/admin/leads/[id]/page.tsx).
export default function AdminNotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold text-muted">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">We couldn&apos;t find that lead</h1>
      <p className="mt-2 text-muted">It may have been deleted, or the link is wrong.</p>
      <Link
        href="/admin/leads"
        className="mt-6 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
      >
        Back to leads
      </Link>
    </main>
  );
}
