"use client"; // Error boundaries must be Client Components.

import Link from "next/link";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-muted">This admin page couldn&apos;t load. Try again, or go back to the overview.</p>
      {error.digest && (
        <p className="mt-2 text-sm text-muted">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
        >
          Try again
        </button>
        <Link href="/admin" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface">
          Back to overview
        </Link>
      </div>
    </main>
  );
}
