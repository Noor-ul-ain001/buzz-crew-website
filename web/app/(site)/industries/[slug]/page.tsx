import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CtaBand from "@/components/CtaBand";
import StartProjectButton from "@/components/inquiry/StartProjectButton";
import CaseStudyCard from "@/components/work/CaseStudyCard";
import { getCaseStudyPage } from "@/lib/content/case-studies";
import { workHref } from "@/lib/content/work-filters";
import { getIndustries, getIndustry } from "@/lib/data/industries";
import { pageMetadata } from "@/lib/metadata";
import { serviceDetail } from "@/lib/services";

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

// Template for industry pages: hero, common challenges, recommended services, clients from
// the brochure and published case studies. Content comes from lib/data/industries.ts.
export default async function IndustryPage({ params }: PageProps<"/industries/[slug]">) {
  const industry = await getIndustry((await params).slug);
  if (!industry) notFound();
  const work = industry.workFilter
    ? (await getCaseStudyPage({ industry: industry.workFilter, service: null, page: 1 }, 3)).items
    : [];

  return (
    <>
      <main className="flex-1">
        <section className="relative isolate overflow-hidden border-b border-border">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_10%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_28rem)]" />
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="rise text-xs font-semibold tracking-[0.32em] text-accent-strong uppercase">Industries · {industry.name}</p>
            <h1 className="rise mt-5 max-w-4xl text-5xl leading-[0.98] tracking-tight text-balance [--d:1] sm:text-7xl">{industry.title}</h1>
            <p className="rise mt-6 max-w-2xl text-lg text-pretty text-muted [--d:2] sm:text-xl">{industry.intro}</p>
            <p className="rise mt-6 inline-block border-l-2 border-accent pl-4 font-display text-xl italic [--d:2]">{industry.tagline}</p>
            <div className="rise mt-9 flex flex-wrap gap-3 [--d:3]">
              <StartProjectButton className="rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-foreground hover:brightness-95" />
              <Link href="#services" className="press rounded-full border border-foreground/30 px-7 py-3.5 font-medium hover:border-foreground">
                See how we help
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="challenges-heading" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <h2 id="challenges-heading" className="reveal text-4xl tracking-tight sm:text-5xl">
            Sound familiar?
          </h2>
          <ul className="reveal-stagger mt-10 grid gap-4 md:grid-cols-3">
            {industry.challenges.map((challenge) => (
              <li key={challenge.title} className="rounded-3xl border border-border bg-surface p-7">
                <h3 className="font-display text-2xl">{challenge.title}</h3>
                <p className="mt-3 text-muted">{challenge.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="services" aria-labelledby="services-heading" className="scroll-mt-24 border-y border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <h2 id="services-heading" className="reveal text-4xl tracking-tight sm:text-5xl">
              Where we&apos;d start
            </h2>
            <p className="reveal mt-4 max-w-2xl text-lg text-muted">
              The services that make the biggest difference for {industry.name.toLowerCase()}, in the order we&apos;d begin.
            </p>
            <ol className="reveal-stagger mt-12 grid gap-4 lg:grid-cols-3">
              {industry.services.map((item, index) => (
                <li key={item.service} className="lift group relative flex flex-col gap-4 rounded-3xl border border-border bg-background p-7 hover:border-accent/60">
                  <span className="text-outline font-display text-5xl leading-none font-bold transition-colors duration-500 group-hover:text-accent">0{index + 1}</span>
                  <h3 className="font-display text-2xl">
                    <Link href={`/services#${serviceDetail(item.service)?.id ?? ""}`} className="after:absolute after:inset-0">
                      {item.service}
                    </Link>
                  </h3>
                  <p className="text-muted">{item.why}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {industry.clients.length > 0 && (
          <section aria-labelledby="clients-heading" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <h2 id="clients-heading" className="reveal text-xs font-semibold tracking-[0.32em] text-accent-strong uppercase">
              Clients in this industry
            </h2>
            <ul className="reveal-stagger mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {industry.clients.map((client) => (
                <li key={client.name} className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-white p-5 text-center">
                  <Image src={client.logo} alt={`${client.name} logo`} width={160} height={160} className="h-20 w-auto object-contain" />
                  <p className="text-sm font-medium text-ink">{client.name}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {work.length > 0 && (
          <section aria-labelledby="work-heading" className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
            <h2 id="work-heading" className="reveal text-4xl tracking-tight sm:text-5xl">
              Our work in {industry.name.toLowerCase()}
            </h2>
            <ul className="reveal-stagger mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {work.map((item) => (
                <li key={item.slug}>
                  <CaseStudyCard caseStudy={item} />
                </li>
              ))}
            </ul>
            {industry.workFilter && (
              <Link href={workHref({ industry: industry.workFilter })} className="link-sweep mt-8 inline-block pb-1 font-semibold">
                See all our {industry.name.toLowerCase()} work →
              </Link>
            )}
          </section>
        )}
      </main>
      <CtaBand heading={industry.ctaHeading} />
    </>
  );
}
