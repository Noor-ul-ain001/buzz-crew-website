import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

// Unmatched URLs render here, inside the root layout only, so the site chrome is added directly.
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start justify-center gap-6 px-4 py-20 sm:px-6">
        <p className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">404</p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          This page has buzzed off.
        </h1>
        <p className="max-w-lg text-lg text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you
          back on track.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-foreground hover:brightness-95"
          >
            Back to home
          </Link>
          <Link href="/contact" className="rounded-full border border-border px-6 py-3.5 font-medium hover:bg-surface">
            Contact us
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
