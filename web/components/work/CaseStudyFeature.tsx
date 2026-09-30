import Image from "next/image";
import Link from "next/link";
import type { CaseStudyCardData } from "@/lib/content/case-studies";
import { COUNTRY_LABELS, INDUSTRY_LABELS, SERVICE_LABELS } from "@/lib/content/work-labels";

// One project per row on the work page: a large cover beside the story and its headline
// numbers. `flip` puts the cover on the right, so consecutive rows alternate.
export default function CaseStudyFeature({
  caseStudy,
  index,
  flip = false,
  headingLevel = "h2",
}: {
  caseStudy: CaseStudyCardData;
  index: number;
  flip?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <article className="group relative grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
      <div className={`relative lg:col-span-7 ${flip ? "lg:order-last" : ""}`}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] border border-border bg-surface transition-colors duration-300 group-hover:border-accent/60">
          <Image
            src={caseStudy.cover.url}
            alt={caseStudy.cover.alt}
            fill
            sizes="(min-width: 1024px) 40rem, 100vw"
            className="object-cover object-top transition-transform duration-1000 ease-out motion-safe:group-hover:scale-[1.03]"
          />
        </div>
        <span
          aria-hidden="true"
          className={`text-outline absolute -top-10 font-display text-8xl leading-none font-bold transition-colors duration-500 group-hover:text-accent sm:-top-12 sm:text-9xl ${
            flip ? "-left-2 lg:-left-6" : "-right-2 lg:-right-6"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="lg:col-span-5">
        <p className="text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase">
          {INDUSTRY_LABELS[caseStudy.industry]} · {COUNTRY_LABELS[caseStudy.country]}
        </p>
        <Heading className="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
          {/* The whole row is clickable through this link's stretched overlay. */}
          <Link href={`/work/${caseStudy.slug}`} className="after:absolute after:inset-0">
            <span className="block text-lg font-medium tracking-normal text-muted">{caseStudy.client_name}</span>
            {caseStudy.title}
          </Link>
        </Heading>
        {caseStudy.summary && <p className="mt-5 max-w-md text-lg text-pretty text-muted">{caseStudy.summary}</p>}

        {caseStudy.headline_metrics.length > 0 && (
          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6">
            {caseStudy.headline_metrics.slice(0, 2).map((metric) => (
              <div key={`${metric.value}-${metric.label}`} className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-muted">{metric.label}</dt>
                <dd className="font-display text-4xl font-semibold tracking-tight text-accent-strong tabular-nums sm:text-5xl">{metric.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <ul className="flex flex-wrap gap-2">
            {caseStudy.services.map((service) => (
              <li key={service} className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
                {SERVICE_LABELS[service]}
              </li>
            ))}
          </ul>
          <span aria-hidden="true" className="inline-flex items-center gap-2 font-semibold">
            View project
            <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}
