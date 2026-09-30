import Image from "next/image";
import Link from "next/link";
import ResultStats from "@/components/work/ResultStats";
import type { CaseStudyCardData } from "@/lib/content/case-studies";
import { COUNTRY_LABELS, INDUSTRY_LABELS } from "@/lib/content/work-labels";

export default function CaseStudyCard({ caseStudy, headingLevel = "h3" }: { caseStudy: CaseStudyCardData; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="lift group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background hover:border-accent/60">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface">
        <Image
          src={caseStudy.cover.url}
          alt={caseStudy.cover.alt}
          fill
          sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
          className="object-cover object-top transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
        />
        <span
          aria-hidden="true"
          className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-accent text-lg text-accent-foreground opacity-0 transition duration-300 group-hover:opacity-100 motion-safe:translate-y-2 motion-safe:group-hover:translate-y-0"
        >
          ↗
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          {INDUSTRY_LABELS[caseStudy.industry]} · {COUNTRY_LABELS[caseStudy.country]}
        </p>
        <Heading className="text-2xl leading-tight tracking-tight text-balance">
          {/* The whole card is clickable through this link's stretched overlay. */}
          <Link href={`/work/${caseStudy.slug}`} className="after:absolute after:inset-0">
            {caseStudy.client_name}: {caseStudy.title}
          </Link>
        </Heading>
        <div className="mt-auto">
          <ResultStats metrics={caseStudy.headline_metrics} size="small" />
        </div>
      </div>
    </article>
  );
}
