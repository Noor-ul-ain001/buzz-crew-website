import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import CtaBand from "@/components/CtaBand";
import StartProjectButton from "@/components/inquiry/StartProjectButton";
import { pageMetadata } from "@/lib/metadata";
import { SERVICE_DETAILS } from "@/lib/services";

export const metadata: Metadata = pageMetadata({
  title: "What we do",
  description:
    "Digital marketing, creative and graphic design, web and software development, UI/UX, video, PR, branding, copywriting, AI and automation, and IoT, from The Buzz Crew in Karachi.",
  path: "/services",
});

// The photo strip from the brochure's "What we do" page.
const STRIP = [
  { src: "/home/tablet.webp", alt: "Designer sketching app screens on a tablet" },
  { src: "/home/code.webp", alt: "Code on a laptop screen" },
  { src: "/home/magazines.webp", alt: "Hands leafing through magazines on a desk" },
  { src: "/home/automation.webp", alt: "Diagram of an automated process" },
  { src: "/home/camera.webp", alt: "Filming a band on a camera monitor" },
];

// The brochure's "How we work" page, word for word.
const PROCESS = [
  ["Discovery & Audit", "We map the brand, the competition, and every gap in the current marketing."],
  ["Strategy", "A content and channel plan built around real goals, not vanity metrics."],
  ["Execution & Creative", "Scripting, shooting, designing, and building, in-house, on schedule."],
  ["Reporting & Growth", "Clear numbers each cycle, and a plan for what scales next."],
] as const;

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold tracking-[0.32em] text-accent-strong uppercase">{children}</p>;
}

export default function ServicesPage() {
  return (
    <>
      <main className="flex-1">
        <section className="relative isolate overflow-hidden border-b border-border">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_0%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_30rem)]" />
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="rise">
              <Eyebrow>What we do</Eyebrow>
            </div>
            <h1 className="rise mt-5 max-w-4xl text-6xl leading-[0.95] tracking-tight text-balance [--d:1] sm:text-8xl">
              Ten disciplines, <em className="text-accent-strong">one</em> crew.
            </h1>
            <p className="rise mt-7 max-w-2xl text-lg leading-8 text-pretty text-muted [--d:2]">
              Strategy-led digital marketing, design, technology and content for local and international brands, all under one roof.
            </p>
            {/* A jump index to each service further down the page. */}
            <nav aria-label="Services on this page" className="rise mt-12 [--d:3]">
              <ol className="grid border-t border-border sm:grid-cols-2 sm:gap-x-10">
                {SERVICE_DETAILS.map((service, index) => (
                  <li key={service.id} className="border-b border-border">
                    <a href={`#${service.id}`} className="group flex items-center justify-between gap-4 py-3.5 font-medium">
                      <span className="flex items-baseline gap-4">
                        <span className="text-xs font-semibold tracking-[0.2em] text-accent-strong tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="transition-transform duration-300 group-hover:translate-x-1">{service.name}</span>
                      </span>
                      <span aria-hidden="true" className="text-muted transition-all duration-300 group-hover:translate-y-0.5 group-hover:text-accent-strong">
                        ↓
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </section>

        {/* The brochure's photo strip, scrolling sideways on phones. */}
        <section aria-label="Our work in pictures" className="py-16">
          <ul className="reveal-stagger mx-auto flex max-w-6xl snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:px-6 lg:grid lg:grid-cols-5 lg:overflow-visible">
            {STRIP.map((photo) => (
              <li key={photo.src} className="group relative aspect-square w-56 shrink-0 snap-start overflow-hidden rounded-2xl border border-accent/40 lg:w-auto">
                <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 220px, 224px" className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105" />
              </li>
            ))}
          </ul>
          <p className="reveal mx-auto mt-8 max-w-2xl px-4 text-center font-display text-xl text-pretty italic text-muted sm:text-2xl">
            Our work focuses on genuine moments, warm tones, and storytelling compositions inspired by everyday life.
          </p>
        </section>

        <section aria-labelledby="services-heading" className="border-y border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <div className="reveal flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <h2 id="services-heading" className="text-5xl leading-[1.03] tracking-tight sm:text-6xl">
                Our services
              </h2>
              <p className="max-w-md text-pretty text-muted">Choose one focused service or bring us in as an extension of your team.</p>
            </div>
            <ol className="mt-14 grid gap-4 md:grid-cols-2">
              {SERVICE_DETAILS.map((service, index) => (
                <li
                  key={service.id}
                  id={service.id}
                  className="reveal group flex scroll-mt-28 flex-col rounded-3xl border border-border bg-background p-7 transition-colors duration-300 hover:border-accent/60 sm:p-9"
                >
                  <span aria-hidden="true" className="text-outline font-display text-6xl leading-none font-bold transition-colors duration-500 group-hover:text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-6 font-display text-3xl leading-tight">{service.name}</h3>
                  <p className="mt-3 text-pretty text-muted">{service.summary}</p>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {service.deliverables.map((item) => (
                      <li key={item} className="rounded-full border border-border px-3 py-1 text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <StartProjectButton
                    services={[service.name]}
                    className="group/cta mt-8 inline-flex items-center gap-2 self-start font-semibold text-accent-strong"
                  >
                    Start a {service.name} project
                    <span aria-hidden="true" className="transition-transform duration-300 group-hover/cta:translate-x-1">
                      →
                    </span>
                  </StartProjectButton>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="process-heading" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-32">
          <div className="reveal">
            <Eyebrow>How we work</Eyebrow>
            <h2 id="process-heading" className="mt-4 max-w-3xl text-5xl leading-[1.03] tracking-tight text-balance sm:text-6xl">
              A repeatable process behind every account.
            </h2>
          </div>
          <ol className="reveal-stagger relative mt-16 grid gap-10 md:grid-cols-4 md:gap-8">
            <span aria-hidden="true" className="draw-x absolute top-0 right-0 left-0 hidden h-px bg-linear-to-r from-accent via-flame to-brand-purple md:block" />
            {PROCESS.map(([title, body], index) => (
              <li key={title} className="relative border-t border-border pt-6 md:border-t-0">
                <span aria-hidden="true" className="absolute -top-1 left-0 hidden size-2 rounded-full bg-accent md:block" />
                <p className="text-sm font-semibold tracking-[0.2em] text-accent-strong tabular-nums">0{index + 1}</p>
                <h3 className="mt-6 font-display text-3xl">{title}</h3>
                <p className="mt-3 leading-7 text-muted">{body}</p>
              </li>
            ))}
          </ol>
          <div className="reveal mt-20 flex flex-col gap-5 rounded-3xl border border-border bg-surface p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h2 className="text-3xl">Not sure where to begin?</h2>
              <p className="mt-2 text-muted">Tell us what is getting in the way. We will help you find the best first move.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <StartProjectButton className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground hover:brightness-95" />
              <Link href="/contact" className="press rounded-full border border-border px-6 py-3 font-medium hover:border-foreground">
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <CtaBand heading="Let's create stories worth remembering." body="Available for worldwide collaborations. Tell us about your brand and the crew will reply within 24 hours." />
    </>
  );
}
