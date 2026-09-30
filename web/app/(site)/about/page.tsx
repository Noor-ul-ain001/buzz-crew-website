import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import CtaBand from "@/components/CtaBand";
import StartProjectButton from "@/components/inquiry/StartProjectButton";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "About The Buzz Crew",
  description:
    "Meet The Buzz Crew: a Karachi-born digital agency helping ambitious brands in Pakistan, the UAE and the UK grow through strategy, creative and technology.",
  path: "/about",
});

const FACTS = [
  { value: "2022", label: "Founded in Karachi" },
  { value: "3", label: "Markets served" },
  { value: "5", label: "Core disciplines" },
];

const VALUES = [
  {
    number: "01",
    title: "Strategy before the scroll",
    body: "Every idea begins with the audience, the objective and the action it needs to earn. Good-looking work is only useful when it moves the business forward.",
  },
  {
    number: "02",
    title: "One crew, joined-up thinking",
    body: "Social, search, design, ads and development work better together. Our specialists share the same brief, context and measure of success.",
  },
  {
    number: "03",
    title: "Creative with a point of view",
    body: "We make work that feels native to the people it is for: culturally aware, unmistakably on-brand and clear enough to be remembered.",
  },
];

const PRINCIPLES = [
  ["Be useful", "We make recommendations that solve a real problem, not work that simply fills a calendar."],
  ["Stay accountable", "Clear reporting keeps the work connected to outcomes, budgets and the next smart decision."],
  ["Build for momentum", "We set up systems and platforms that can keep improving long after launch day."],
] as const;

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold tracking-[0.32em] text-accent-strong uppercase">{children}</p>;
}

export default function AboutPage() {
  return (
    <>
      <main className="flex-1">
        <section className="relative isolate overflow-hidden border-b border-border">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_15%,color-mix(in_oklab,var(--accent)_20%,transparent),transparent_26rem)]" />
          <div className="mx-auto grid w-full max-w-6xl gap-16 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="rise">
                <Eyebrow>About The Buzz Crew</Eyebrow>
              </div>
              <h1 className="rise mt-5 max-w-3xl text-6xl leading-[0.95] tracking-tight text-balance [--d:1] sm:text-8xl">
                A crew for brands with somewhere to <em className="text-accent-strong">go.</em>
              </h1>
              <p className="rise mt-7 max-w-xl text-lg leading-8 text-pretty text-muted [--d:2] sm:text-xl">
                We are a Karachi-born digital agency bringing strategy, creative and technology together for businesses ready to grow with purpose.
              </p>
              <div className="rise mt-8 flex flex-wrap gap-3 [--d:3]">
                <StartProjectButton className="rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-foreground hover:brightness-95" />
                <Link href="/work" className="press rounded-full border border-foreground/30 px-7 py-3.5 font-medium hover:border-foreground">
                  See our work
                </Link>
              </div>
              <dl className="rise mt-14 grid max-w-lg grid-cols-3 border-t border-border pt-6 [--d:4]">
                {FACTS.map((fact) => (
                  <div key={fact.label} className="flex flex-col-reverse gap-1">
                    <dt className="text-sm text-muted">{fact.label}</dt>
                    <dd className="font-display text-4xl font-semibold tracking-tight text-accent-strong tabular-nums">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {/* A layered collage: the team photo with the gold mark on an ink tile overlapping it. */}
            <div className="rise relative mx-auto w-full max-w-md pb-16 pl-10 [--d:2] lg:col-span-5 lg:mx-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
                <Image src="/home/team.webp" alt="The Buzz Crew collaborating around a table" fill priority sizes="(min-width: 1024px) 420px, 90vw" className="object-cover" />
              </div>
              <div className="absolute bottom-0 left-0 w-44 rounded-[1.75rem] border border-white/10 bg-ink p-6 shadow-2xl sm:w-52">
                <Image src="/brand/logo-gold.png" alt="" width={585} height={616} className="float w-full drop-shadow-[0_0_1.5rem_rgba(255,201,60,0.25)]" />
                <p className="mt-4 text-center text-[0.65rem] font-semibold tracking-[0.3em] text-white/65 uppercase">Karachi · Worldwide</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="story-heading" className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:py-32">
          <div className="reveal lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
            <Eyebrow>Our story</Eyebrow>
            <h2 id="story-heading" className="mt-4 text-5xl leading-[1.03] tracking-tight text-balance sm:text-6xl">
              Built to make growth feel less fragmented.
            </h2>
          </div>
          <div className="lg:col-span-7">
            <blockquote className="reveal border-l-2 border-accent pl-6 font-display text-3xl leading-snug font-medium text-balance sm:text-4xl">
              Ambitious businesses should not need a different partner for every piece of their growth.
            </blockquote>
            <div className="reveal-stagger mt-10 max-w-2xl space-y-5 text-lg leading-8 text-pretty text-muted">
              <p>That simple belief started The Buzz Crew in 2022.</p>
              <p>
                Today, our team works across social media, search, web, UI/UX and paid media for brands in Pakistan, the UAE, the UK and beyond. We combine local fluency with a global standard of craft.
              </p>
              <p>We are practical partners: curious about the business, direct about what is needed and invested in making the next move count.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="values-heading" className="border-y border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <div className="reveal">
              <Eyebrow>What guides us</Eyebrow>
              <h2 id="values-heading" className="mt-4 max-w-3xl text-5xl leading-[1.03] tracking-tight text-balance sm:text-6xl">
                The way we show up in the work.
              </h2>
            </div>
            {/* Rows with outlined numerals that fill with gold on hover. */}
            <ol className="mt-14 border-t border-border">
              {VALUES.map((value) => (
                <li key={value.number} className="reveal group grid gap-4 border-b border-border py-10 md:grid-cols-[9rem_1fr_1.2fr] md:items-center md:gap-10">
                  <p aria-hidden="true" className="text-outline font-display text-7xl font-bold transition-colors duration-500 group-hover:text-accent sm:text-8xl">
                    {value.number}
                  </p>
                  <h3 className="text-3xl leading-tight font-semibold tracking-tight">{value.title}</h3>
                  <p className="leading-7 text-pretty text-muted">{value.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="principles-heading" className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:py-32">
          <div className="reveal">
            <Eyebrow>Our working principles</Eyebrow>
            <h2 id="principles-heading" className="mt-4 text-5xl leading-[1.03] tracking-tight text-balance sm:text-6xl">
              Close enough to care. Sharp enough to challenge.
            </h2>
          </div>
          <ul className="reveal-stagger divide-y divide-border border-y border-border">
            {PRINCIPLES.map(([title, body]) => (
              <li key={title} className="group grid gap-3 py-7 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <h3 className="flex items-center gap-3 text-xl font-semibold">
                  <span aria-hidden="true" className="h-px w-4 bg-accent transition-[width] duration-500 group-hover:w-8" />
                  {title}
                </h3>
                <p className="leading-7 text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <CtaBand heading="Bring your next chapter to the crew." body="Whether you need a clearer strategy, stronger creative or a better digital foundation, we are ready to build it with you." />
    </>
  );
}
