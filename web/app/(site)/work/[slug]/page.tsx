import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CaseStudyView from "@/components/work/CaseStudyView";
import TrackView from "@/components/work/TrackView";
import { getCaseStudy, getCaseStudySlugs } from "@/lib/content/case-studies";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Published slugs are built ahead; new ones render on first request (dynamicParams).
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getCaseStudySlugs()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const found = await getCaseStudy((await params).slug);
  if (found.kind !== "found") return { title: "Case study not found" };
  const { caseStudy } = found;
  const path = `/work/${caseStudy.slug}`;
  return {
    title: caseStudy.seo_title,
    description: caseStudy.seo_description,
    alternates: { canonical: path },
    openGraph: {
      title: `${caseStudy.seo_title} | ${SITE_NAME}`,
      description: caseStudy.seo_description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_GB",
      type: "article",
      publishedTime: caseStudy.published_at,
      modifiedTime: caseStudy.updated_at,
    },
  };
}

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const found = await getCaseStudy((await params).slug);
  // An old address of a renamed case study: 308 to the current one (005 T022).
  if (found.kind === "redirect") permanentRedirect(`/work/${found.slug}`);
  if (found.kind === "missing") notFound();
  const { caseStudy } = found;
  const url = new URL(`/work/${caseStudy.slug}`, SITE_URL).toString();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: caseStudy.title,
      headline: caseStudy.title,
      description: caseStudy.summary,
      url,
      image: new URL(caseStudy.cover.url, SITE_URL).toString(),
      datePublished: caseStudy.published_at,
      dateModified: caseStudy.updated_at,
      creator: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      about: caseStudy.client_name,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Work", item: new URL("/work", SITE_URL).toString() },
        { "@type": "ListItem", position: 2, name: caseStudy.client_name, item: url },
      ],
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-12 sm:px-6 sm:pt-16">
      <script
        type="application/ld+json"
        // Escape "<" so content can never close the script tag early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <TrackView slug={caseStudy.slug} />
      <CaseStudyView caseStudy={caseStudy} />
    </main>
  );
}
