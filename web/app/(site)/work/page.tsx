import type { Metadata } from "next";
import Link from "next/link";
import CtaBand from "@/components/CtaBand";
import StartProjectButton from "@/components/inquiry/StartProjectButton";
import CaseStudyFeature from "@/components/work/CaseStudyFeature";
import WorkFilters from "@/components/work/WorkFilters";
import { getCaseStudyPage, type CaseStudyCardData } from "@/lib/content/case-studies";
import { parseWorkFilters, workHref } from "@/lib/content/work-filters";
import { pageMetadata } from "@/lib/metadata";

const PAGE_SIZE = 12;

// "156K" -> 156000, "2,946" -> 2946; anything else counts as nothing.
function countFrom(value: string): number {
  const match = /^([\d,.]+)\s*([KkMm])?$/.exec(value.trim());
  if (!match) return 0;
  const number = Number(match[1].replace(/,/g, ""));
  const scale = match[2]?.toLowerCase() === "m" ? 1_000_000 : match[2] ? 1_000 : 1;
  return Number.isFinite(number) ? number * scale : 0;
}

/** Combined Instagram followers across the projects, rounded down, e.g. "360K+". */
function combinedAudience(items: CaseStudyCardData[]): string | null {
  const total = items
    .flatMap((item) => item.headline_metrics)
    .filter((metric) => /followers/i.test(metric.label))
    .reduce((sum, metric) => sum + countFrom(metric.value), 0);
  if (total < 1_000) return null;
  return total >= 1_000_000 ? `${Math.floor(total / 100_000) / 10}M+` : `${Math.floor(total / 10_000) * 10}K+`;
}

export async function generateMetadata({ searchParams }: PageProps<"/work">): Promise<Metadata> {
  const filters = parseWorkFilters(await searchParams);
  const base = pageMetadata({
    title: "Our work",
    description: "Case studies with measurable results: social media, SEO, websites and Meta Ads for brands in Pakistan, the UAE and the UK.",
    path: "/work",
  });
  // Filtered views share the canonical /work and stay out of search results.
  const filtered = filters.industry !== null || filters.service !== null || filters.page > 1;
  return filtered ? { ...base, robots: { index: false, follow: true } } : base;
}

export default async function WorkPage({ searchParams }: PageProps<"/work">) {
  const filters = parseWorkFilters(await searchParams);
  // "Load more" keeps ?page=N in the address, so page N shows everything up to it.
  const pages = await Promise.all(
    Array.from({ length: filters.page }, (_, index) => getCaseStudyPage({ ...filters, page: index + 1 }, PAGE_SIZE)),
  );
  const items: CaseStudyCardData[] = pages.flatMap((page) => page.items);
  const { total, facets } = pages[0];
  const filtered = filters.industry !== null || filters.service !== null;
  const audience = filtered ? null : combinedAudience(items);

  return (
    <>
      <main className="flex-1">
        <section className="relative isolate overflow-hidden border-b border-border">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_90%_10%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_28rem)]" />
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-16 pb-12 sm:px-6 sm:pt-24 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="rise text-xs font-semibold tracking-[0.32em] text-accent-strong uppercase">Case studies</p>
              <h1 className="rise mt-5 text-6xl leading-[0.95] tracking-tight text-balance [--d:1] sm:text-8xl">
                Work that moved the <em className="text-accent-strong">numbers.</em>
              </h1>
            </div>
            <div className="rise flex flex-col gap-6 [--d:2] lg:col-span-4 lg:pb-3">
              <p className="text-lg text-pretty text-muted">Real projects, the strategy behind them, and the results they delivered.</p>
              <dl className="grid grid-cols-2 gap-6 border-t border-border pt-6">
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-sm text-muted">{total === 1 ? "Project" : "Projects"} {filtered ? "in this view" : "published"}</dt>
                  <dd className="font-display text-5xl font-semibold tracking-tight text-accent-strong tabular-nums">{total}</dd>
                </div>
                {audience && (
                  <div className="flex flex-col-reverse gap-1">
                    <dt className="text-sm text-muted">Combined Instagram audience</dt>
                    <dd className="font-display text-5xl font-semibold tracking-tight text-accent-strong tabular-nums">{audience}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="rise rounded-3xl border border-border bg-surface p-5 [--d:3] sm:p-6">
            <WorkFilters filters={filters} facets={facets} />
          </div>
          <p role="status" className="mt-6 text-sm text-muted">
            {total === 1 ? "1 case study" : `${total} case studies`}
            {filtered ? " match these filters" : ""}
          </p>

          {items.length === 0 ? (
            <div className="mt-8 flex flex-col items-start gap-4 rounded-3xl border border-dashed border-border p-8">
              <p className="text-lg">{filtered ? "No case studies match that combination yet." : "Case studies are on their way."}</p>
              <div className="flex flex-wrap gap-3">
                {filtered && (
                  <Link href="/work" replace scroll={false} className="press rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface">
                    Clear filters
                  </Link>
                )}
                <StartProjectButton className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground" />
              </div>
            </div>
          ) : (
            // One project per row, alternating sides, so each gets room for its story and numbers.
            <ul className="mt-20 flex flex-col gap-24 lg:gap-32">
              {items.map((item, index) => (
                <li key={item.slug} className="reveal">
                  <CaseStudyFeature caseStudy={item} index={index} flip={index % 2 === 1} />
                </li>
              ))}
            </ul>
          )}

          {items.length < total && (
            <div className="mt-12 flex justify-center">
              <Link
                href={workHref({ ...filters, page: filters.page + 1 })}
                replace
                scroll={false}
                className="press rounded-full border border-foreground px-6 py-3 font-semibold hover:bg-surface"
              >
                Load more case studies
              </Link>
            </div>
          )}
        </div>
      </main>
      <CtaBand heading="Want results like these?" body="Tell us where your brand is today and where it needs to be. The crew will map the route." />
    </>
  );
}
