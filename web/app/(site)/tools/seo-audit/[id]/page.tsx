import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShareButtons from "@/components/ShareButtons";
import CtaBand from "@/components/CtaBand";
import AuditResults from "@/components/seo-audit/AuditResults";
import EmailReportForm from "@/components/seo-audit/EmailReportForm";
import { getAudit } from "@/lib/seo-audit/audit";
import { SITE_URL } from "@/lib/site";

// Result pages are personal and endless in number, so keep them out of search engines.
export async function generateMetadata({ params }: PageProps<"/tools/seo-audit/[id]">): Promise<Metadata> {
  const result = await getAudit((await params).id);
  return {
    title: result ? `SEO audit for ${result.host}` : "Audit not found",
    robots: { index: false, follow: false },
  };
}

export default async function AuditResultPage({ params }: PageProps<"/tools/seo-audit/[id]">) {
  const result = await getAudit((await params).id);
  if (!result) notFound();

  return (
    <>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/tools/seo-audit" className="text-sm font-medium text-muted hover:text-foreground">
          ← Run another audit
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted">Free SEO audit</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight break-words sm:text-5xl">{result.host}</h1>
        <p className="mt-2 break-all text-muted">{result.url}</p>
        <div className="mt-6">
          <ShareButtons url={new URL(`/tools/seo-audit/${result.id}`, SITE_URL).toString()} title={`SEO audit for ${result.host}`} />
        </div>

        <div className="mt-12">
          <AuditResults result={result} />
        </div>

        <section className="mt-12 rounded-3xl border border-border p-6 sm:p-8">
          <EmailReportForm auditId={result.id} />
        </section>
      </main>
      <CtaBand heading="Want us to fix it for you?" body="Our team can take care of every item in this report. Tell us about your site." />
    </>
  );
}
