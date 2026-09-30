import Link from "next/link";

/** Shown instead of admin-only pages; rendered before any data is fetched (003 T023). */
export default function AccessDenied() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">You don&apos;t have access to this page</h1>
      <p className="mt-2 max-w-prose text-muted">
        This section is for admins. If you need it for your work, ask an admin to change your role.
      </p>
      <Link
        href="/admin/content"
        className="mt-6 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
      >
        Go to content
      </Link>
    </main>
  );
}
