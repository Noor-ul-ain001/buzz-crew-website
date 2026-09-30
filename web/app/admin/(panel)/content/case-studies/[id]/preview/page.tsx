import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CaseStudyView from "@/components/work/CaseStudyView";
import { previewDetail } from "@/lib/content/case-study-admin";
import { loadCaseStudy } from "@/lib/content/case-study-server";

// Signed-in only (the admin layout checks the session), never indexed (admin metadata).
export const metadata: Metadata = { title: "Preview case study" };

export default async function PreviewCaseStudyPage({ params }: PageProps<"/admin/content/case-studies/[id]/preview">) {
  const { id } = await params;
  const item = await loadCaseStudy(id);
  if (!item) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div role="status" className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent px-4 py-3 text-accent-foreground">
        <p className="font-semibold">
          Preview{item.status === "draft" ? " of a draft" : ""}: this is how the page will look. Only signed-in team members can see it.
        </p>
        <Link href={`/admin/content/case-studies/${item.id}`} className="rounded-full bg-accent-foreground px-4 py-1.5 text-sm font-semibold text-accent">
          Back to editing
        </Link>
      </div>
      <CaseStudyView caseStudy={previewDetail(item)} preview />
    </main>
  );
}
