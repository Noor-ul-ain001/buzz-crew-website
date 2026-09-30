import Image from "next/image";
import Link from "next/link";
import ShareButtons from "@/components/ShareButtons";
import BeforeAfterSlider from "@/components/work/BeforeAfterSlider";
import CaseStudyCard from "@/components/work/CaseStudyCard";
import MarkdownSection from "@/components/work/MarkdownSection";
import ReelPlayer from "@/components/work/ReelPlayer";
import ResultStats from "@/components/work/ResultStats";
import SimilarProjectCta from "@/components/work/SimilarProjectCta";
import type { CaseStudyDetail } from "@/lib/content/case-studies";
import { COUNTRY_LABELS, INDUSTRY_LABELS, SERVICE_LABELS } from "@/lib/content/work-labels";
import { SITE_URL } from "@/lib/site";

// The case study page, shared by /work/[slug] and the signed-in admin preview (005 T010,
// T021): results first, then challenge, strategy, execution, all results, media and quote.
export default function CaseStudyView({ caseStudy, preview = false }: { caseStudy: CaseStudyDetail; preview?: boolean }) {
  const url = new URL(`/work/${caseStudy.slug}`, SITE_URL).toString();
  const images = caseStudy.media.filter((item) => item.kind === "image");
  const reels = caseStudy.media.filter((item) => item.kind === "reel");

  return (
    <article className="flex flex-col gap-14 pb-24 lg:pb-16">
      <header className="flex flex-col gap-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <li>
              <Link href="/work" className="hover:text-foreground">
                Work
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{caseStudy.client_name}</li>
          </ol>
        </nav>
        <p className="text-sm font-semibold tracking-wide text-muted uppercase">
          {caseStudy.client_name} · {INDUSTRY_LABELS[caseStudy.industry]} · {COUNTRY_LABELS[caseStudy.country]}
        </p>
        <h1 className="text-5xl leading-[1.02] sm:text-7xl">{caseStudy.title}</h1>
        <ul aria-label="Services" className="flex flex-wrap gap-2">
          {caseStudy.services.map((service) => (
            <li key={service} className="rounded-full border border-border px-3 py-1 text-sm">
              {SERVICE_LABELS[service]}
            </li>
          ))}
        </ul>
        <ResultStats metrics={caseStudy.headline_metrics} />
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-surface">
          <Image src={caseStudy.cover.url} alt={caseStudy.cover.alt} fill priority sizes="(min-width: 1152px) 72rem, 100vw" className="object-cover" />
        </div>
        {caseStudy.project_period && <p className="text-sm text-muted">Project period: {caseStudy.project_period}</p>}
      </header>

      <div className="flex max-w-3xl flex-col gap-12">
        <MarkdownSection id="challenge" title="The challenge" markdown={caseStudy.challenge_md} />
        <MarkdownSection id="strategy" title="Our strategy" markdown={caseStudy.strategy_md} />
        <MarkdownSection id="execution" title="How we did it" markdown={caseStudy.execution_md} />
      </div>

      <section aria-labelledby="results" className="flex flex-col gap-5">
        <h2 id="results" className="text-3xl sm:text-4xl">
          The results
        </h2>
        <ResultStats metrics={caseStudy.results} />
      </section>

      {caseStudy.before_after && (
        <section aria-labelledby="before-after" className="flex flex-col gap-5">
          <h2 id="before-after" className="text-3xl sm:text-4xl">
            {caseStudy.before_after.before_label} and {caseStudy.before_after.after_label.toLowerCase()}
          </h2>
          <BeforeAfterSlider
            before={caseStudy.before_after.before}
            after={caseStudy.before_after.after}
            beforeLabel={caseStudy.before_after.before_label}
            afterLabel={caseStudy.before_after.after_label}
          />
        </section>
      )}

      {(images.length > 0 || reels.length > 0) && (
        <section aria-labelledby="media" className="flex flex-col gap-5">
          <h2 id="media" className="text-3xl sm:text-4xl">
            The work
          </h2>
          {reels.length > 0 && (
            <ul className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3">
              {reels.map((reel) => (
                <li key={reel.video_url}>
                  <ReelPlayer videoUrl={reel.video_url ?? ""} description={reel.description ?? "Reel"} preview={reel.image} />
                </li>
              ))}
            </ul>
          )}
          {images.length > 0 && (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {images.map((item) => (
                <li key={item.image.url} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
                  <Image src={item.image.url} alt={item.image.alt} fill loading="lazy" sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {caseStudy.testimonial && (
        <figure className="rounded-3xl border border-border p-6 sm:p-10">
          <blockquote className="font-display text-3xl leading-snug sm:text-4xl">
            <p>&ldquo;{caseStudy.testimonial.quote}&rdquo;</p>
          </blockquote>
          <figcaption className="mt-6 text-muted">
            <span className="font-semibold text-foreground">{caseStudy.testimonial.name}</span>
            {[caseStudy.testimonial.role, caseStudy.testimonial.company].filter(Boolean).length > 0 &&
              `, ${[caseStudy.testimonial.role, caseStudy.testimonial.company].filter(Boolean).join(", ")}`}
          </figcaption>
        </figure>
      )}

      {!preview && <ShareButtons url={url} title={`${caseStudy.client_name}: ${caseStudy.title}`} />}

      <SimilarProjectCta services={caseStudy.services} slug={caseStudy.slug} />
      {!preview && <SimilarProjectCta services={caseStudy.services} slug={caseStudy.slug} variant="sticky" />}

      {caseStudy.related.length > 0 && (
        <section aria-labelledby="related" className="flex flex-col gap-5">
          <h2 id="related" className="text-3xl sm:text-4xl">
            Related work
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {caseStudy.related.map((item) => (
              <li key={item.slug}>
                <CaseStudyCard caseStudy={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
