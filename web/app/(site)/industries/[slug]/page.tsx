import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CtaBand from "@/components/CtaBand";
import StartProjectButton from "@/components/inquiry/StartProjectButton";
import { workHref } from "@/lib/content/work-filters";
import type { Industry as WorkIndustry } from "@/lib/content/work-labels";
import { getIndustries, getIndustry } from "@/lib/data/industries";
import { pageMetadata } from "@/lib/metadata";

// Which /work filter matches each industry page (real estate has no case study industry yet).
const WORK_FILTER: Record<string, WorkIndustry | undefined> = {
  "restaurant-marketing-karachi": "food_beverages",
  "clinic-marketing-uk": "healthcare_dental",
};

export async function generateStaticParams() {
  return (await getIndustries()).map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata({ params }: PageProps<"/industries/[slug]">): Promise<Metadata> {
  const industry = await getIndustry((await params).slug);
  if (!industry) return { title: "Industry not found" };
  return pageMetadata({
    title: industry.title,
    description: industry.metaDescription,
    path: `/industries/${industry.slug}`,
  });
}

// Template for industry landing pages: hero, pain points, recommended services, case
// studies and a closing call to action. Content comes from lib/data/industries.ts.
export default async function IndustryPage({ params }: PageProps<"/industries/[slug]">) {
  const industry = await getIndustry((await params).slug);
  if (!industry) notFound();

  return (
    <>
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.6fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted">Industries · {industry.name}</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance sm:text-6xl">{industry.title}</h1>
              <p className="mt-5 max-w-2xl text-lg text-muted sm:text-xl">{industry.intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <StartProjectButton className="rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-foreground hover:brightness-95" />
                <Link href="#services" className="rounded-full border border-border px-6 py-3.5 font-medium hover:bg-surface">
                  See how we help
                </Link>
              </div>
            </div>
            {/* Always dark (brand ink), so the yellow figure keeps its contrast in both themes. */}
            <div className="rounded-3xl bg-ink p-8 text-white">
              <p className="text-6xl font-bold tracking-tight text-accent">{industry.heroStat.value}</p>
              <p className="mt-3 text-lg">{industry.heroStat.label}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="pain-heading" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="pain-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Sound familiar?
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {industry.painPoints.map((point) => (
              <li key={point.title} className="rounded-2xl border border-border p-6">
                <h3 className="text-lg font-semibold">{point.title}</h3>
                <p className="mt-2 text-muted">{point.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="services" aria-labelledby="services-heading" className="scroll-mt-8 bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <h2 id="services-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
              What we recommend
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-muted">
              The services that make the biggest difference for {industry.name.toLowerCase()}, in the order we&apos;d start.
            </p>
            <ol className="mt-10 grid gap-4 lg:grid-cols-3">
              {industry.services.map((item, index) => (
                <li key={item.service} className="flex flex-col gap-3 rounded-2xl bg-background p-6">
                  <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-semibold">{item.service}</h3>
                  <p className="text-muted">{item.why}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="cases-heading" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="cases-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Related case studies
          </h2>
          {/* These cards are still sample copy from lib/data/industries.ts. Follow-up (007, which
              wires industry pages to the API): show real case studies for this industry here,
              each linking to /work/{slug}. Until then, the link below opens the filtered list. */}
          <ul className="mt-10 grid gap-6 md:grid-cols-2">
            {industry.caseStudies.map((study) => (
              <li key={study.client} className="flex flex-col gap-4 rounded-3xl border border-border p-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted">{study.client}</p>
                <h3 className="text-2xl font-semibold tracking-tight">{study.title}</h3>
                <p className="text-muted">{study.summary}</p>
                <p className="mt-auto border-t border-border pt-4">
                  <span className="block text-4xl font-bold tracking-tight">{study.metric}</span>
                  <span className="text-muted">{study.metricLabel}</span>
                </p>
              </li>
            ))}
          </ul>
          {WORK_FILTER[industry.slug] && (
            <Link href={workHref({ industry: WORK_FILTER[industry.slug] })} className="mt-8 inline-block font-semibold underline underline-offset-4">
              See all our {industry.name.toLowerCase()} work
            </Link>
          )}
        </section>
      </main>
      <CtaBand heading={industry.ctaHeading} />
    </>
  );
}
