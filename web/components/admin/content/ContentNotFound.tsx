import Link from "next/link";

export default function ContentNotFound({ noun, listHref }: { noun: string; listHref: string }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">We couldn&apos;t find that {noun}</h1>
      <p className="mt-2 text-muted">It may have been removed, or the link is wrong.</p>
      <Link href={listHref} className="mt-6 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background">
        Back to the list
      </Link>
    </main>
  );
}
