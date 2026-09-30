import type { Metadata } from "next";
import Link from "next/link";
import Overview from "@/components/admin/overview/Overview";
import { getCurrentUser, serverApi } from "@/lib/auth/session";

// A layout's title template only applies to child segments, not to the page beside it.
export const metadata: Metadata = { title: { absolute: "Overview · Admin | The Buzz Crew" } };

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  // The lead widgets are admin-only (003 T023); editors get a content-focused start page.
  if (user.role === "admin") {
    const api = await serverApi();
    const { data } = await api.GET("/api/v1/admin/activity", { cache: "no-store" });
    return <Overview activity={data ?? null} />;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
      <p className="mt-1 text-muted">You can manage the website&apos;s posts, team, testimonials, FAQs and more.</p>
      <Link
        href="/admin/content"
        className="mt-6 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
      >
        Go to content
      </Link>
    </main>
  );
}
