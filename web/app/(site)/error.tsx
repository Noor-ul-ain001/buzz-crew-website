"use client"; // Error boundaries must be Client Components.

import Link from "next/link";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  // TODO: report `error` to the error-tracking service (with PII scrubbed) once it is set up.

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start justify-center gap-6 px-4 py-20 sm:px-6">
      <p className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">Error</p>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        Something went wrong on our side.
      </h1>
      <p className="max-w-lg text-lg text-muted">
        Sorry about that. Please try again, or head back to the home page.
      </p>
      {error.digest && (
        <p className="text-sm text-muted">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-foreground hover:brightness-95"
        >
          Try again
        </button>
        <Link href="/" className="rounded-full border border-border px-6 py-3.5 font-medium hover:bg-surface">
          Back to home
        </Link>
      </div>
    </main>
  );
}
