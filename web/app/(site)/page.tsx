import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import CtaBand from "@/components/CtaBand";
import ClientLogoMarquee from "@/components/home/ClientLogoMarquee";
import TestimonialsCarousel from "@/components/home/TestimonialsCarousel";
import StartProjectButton from "@/components/inquiry/StartProjectButton";
import { getPublishedClientLogos, getPublishedTestimonials } from "@/lib/content/public";
import { SERVICE_DETAILS } from "@/lib/services";
import { CONTACT_EMAIL, INSTAGRAM_URL, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

// Content from the agency brochure (ABOUT BUZZ CREW.pdf) and intro deck
// (THE_BUZZ_CREW_Intro_Deck.pptx). Photos are the brochure's own images.

// The home page uses the plain site name rather than the "%s | The Buzz Crew" template.
export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} | Digital marketing agency in Karachi` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME}: ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
};

const STATS = [
  { value: "4+", label: "Years of experience" },
  { value: "90+", label: "Projects completed" },
  { value: "12+", label: "International clients" },
  { value: "3", label: "Photography awards" },
];

const PILLARS = [
  { title: "Mission", body: "To give every client, local or international, agency-level marketing without juggling multiple vendors." },
  { title: "Vision", body: "To become a leading name in digital marketing, known for creativity, consistency and measurable growth." },
  { title: "Approach", body: "Strategy first: every campaign and platform we build serves clear business objectives, not trends alone." },
];

const PROCESS = [
  { title: "Discovery & Audit", body: "We map the brand, the competition, and every gap in the current marketing." },
  { title: "Strategy", body: "A content and channel plan built around real goals, not vanity metrics." },
  { title: "Execution & Creative", body: "Scripting, shooting, designing, and building, in-house, on schedule." },
  { title: "Reporting & Growth", body: "Clear numbers each cycle, and a plan for what scales next." },
];

const INDUSTRIES = [
  { name: "Food & beverages", detail: "Restaurants, catering, cafés and home kitchens", href: "/industries/food-and-beverages" },
  { name: "Farmhouses", detail: "Event and picnic venues", href: "/industries/farmhouses" },
  { name: "Healthcare & dental", detail: "Automation systems for clinics and hospitals", href: "/industries/healthcare-and-dental" },
  { name: "Education", detail: "Enrolment-focused marketing for schools and institutes", href: "/industries/education" },
  { name: "E-commerce", detail: "Customised e-commerce brand development", href: "/industries/e-commerce" },
];

const JOURNEY = [
  { year: "2022", title: "The crew is born", body: "The Buzz Crew starts out in Karachi." },
  { year: "2023", title: "First clients on board", body: "Local businesses trust the crew with their digital growth." },
  { year: "2024", title: "Going international", body: "Services expand to clients in the UAE, the UK and beyond." },
  { year: "2026", title: "Full-service crew", body: "Ten disciplines, one integrated agency." },
];

// Spaced capitals, as in the brochure's headings.
function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold tracking-[0.32em] text-accent-strong uppercase">{children}</p>;
}

function SectionHeading({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={`mt-4 text-5xl leading-[1.05] sm:text-6xl ${className}`}>
      {children}
    </h2>
  );
}

const DISCIPLINES = SERVICE_DETAILS.map((service) => service.name);

export default async function Home() {
  const [testimonials, logos] = await Promise.all([getPublishedTestimonials(), getPublishedClientLogos()]);

  return (
    <>
      <main className="flex-1">
        {/* Hero: the brochure's cover, the night-time earth with glowing connections. */}
        <section className="relative isolate overflow-hidden">
          <Image
            src="/home/hero-network.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-30 object-cover object-[center_70%]"
          />
          {/* Darken the photo towards the text, and fade it into the page at the bottom. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20"
            style={{
              background:
                "linear-gradient(90deg, var(--background) 10%, color-mix(in oklab, var(--background) 72%, transparent) 55%, color-mix(in oklab, var(--background) 30%, transparent)), linear-gradient(0deg, var(--background) 0%, transparent 40%)",
            }}
          />
          {/* A faint grid, fading out towards the edges, gives the dark space some structure. */}
          <div aria-hidden="true" className="hero-grid absolute inset-0 -z-10" />

          <div className="mx-auto flex min-h-[calc(100svh-4.25rem)] w-full max-w-6xl flex-col px-4 pt-12 pb-8 sm:px-6 sm:pt-16 lg:pt-20">
            <div className="grid flex-1 items-center gap-12 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <p className="rise inline-flex items-center gap-2.5 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-[0.7rem] font-semibold tracking-[0.2em] uppercase backdrop-blur-md max-[359px]:tracking-[0.08em]">
                  <span aria-hidden="true" className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex size-full rounded-full bg-accent opacity-70 motion-safe:animate-ping" />
                    <span className="relative inline-flex size-2 rounded-full bg-accent" />
                  </span>
                  Karachi · Working worldwide
                </p>
                <h1 className="rise mt-7 text-6xl leading-[0.92] font-semibold tracking-tight [--d:1] sm:text-8xl lg:text-[7.5rem]">
                  {SITE_TAGLINE.replace(/stories\.$/, "")}
                  <span className="relative inline-block">
                    <em className="text-accent-strong">stories.</em>
                    {/* Hand-drawn underline that draws itself in once the headline has landed. */}
                    <svg aria-hidden="true" viewBox="0 0 300 24" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full text-flame sm:-bottom-3 sm:h-5">
                      <path className="draw-stroke" d="M4 16 C 60 6, 120 4, 180 10 S 270 20, 296 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                  </span>
                </h1>
                <p className="rise mt-8 max-w-xl text-lg text-pretty text-muted [--d:2] sm:text-xl">
                  A full-service digital agency founded in Karachi in 2022. Strategy-led social media, SEO, web development
                  and design for brands in Pakistan, the UAE, the UK and beyond.
                </p>
                <div className="rise mt-9 flex flex-wrap items-center gap-3 [--d:3]">
                  <StartProjectButton className="group rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-foreground shadow-[0_0_2.5rem_-0.5rem_var(--accent)] hover:brightness-95 max-[399px]:w-full" />
                  <Link
                    href="#services"
                    className="press group inline-flex items-center justify-center gap-2 rounded-full border border-foreground/30 px-7 py-3.5 font-medium backdrop-blur-sm hover:border-foreground max-[399px]:w-full"
                  >
                    See what we do
                    <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-y-0.5">
                      ↓
                    </span>
                  </Link>
                </div>
                <p className="rise mt-5 text-sm text-muted [--d:3]">Replies within 24 hours · No obligation</p>
              </div>

              {/* The logo at the centre of slowly turning orbits, with the core services riding them. */}
              <div aria-hidden="true" className="rise relative mx-auto hidden aspect-square w-full max-w-sm [--d:2] lg:col-span-4 lg:block">
                <div className="spin-slow absolute inset-0 rounded-full border border-dashed border-foreground/15">
                  <span className="absolute top-1/2 -left-1.5 size-3 rounded-full bg-accent shadow-[0_0_1rem_var(--accent)]" />
                </div>
                <div className="spin-slow-reverse absolute inset-10 rounded-full border border-foreground/10">
                  <span className="absolute -top-1 left-1/2 size-2 rounded-full bg-brand-teal shadow-[0_0_1rem_var(--brand-teal)]" />
                </div>
                <div className="absolute inset-20 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--brand-purple)_45%,transparent),transparent_70%)]" />
                <Image
                  src="/brand/logo-gold.png"
                  alt=""
                  width={585}
                  height={616}
                  priority
                  sizes="(min-width: 1024px) 200px, 0px"
                  className="float absolute inset-0 m-auto w-1/2 drop-shadow-[0_0_40px_color-mix(in_oklab,var(--accent)_35%,transparent)]"
                />
                {["Marketing", "Design", "Web", "Video", "AI"].map((label, index) => (
                  <span
                    key={label}
                    className="float absolute rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-semibold backdrop-blur-md"
                    style={{
                      top: `${[6, 24, 78, 88, 46][index]}%`,
                      left: `${[62, 2, 8, 58, 86][index]}%`,
                      animationDelay: `${index * -1.3}s`,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats on a frosted bar, so the photo still shows through. */}
            <dl className="rise mt-14 grid grid-cols-2 overflow-hidden rounded-3xl border border-border bg-surface/60 backdrop-blur-md [--d:4] sm:grid-cols-4">
              {STATS.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`flex flex-col-reverse gap-1 p-4 sm:p-6 ${index % 2 === 1 ? "border-l border-border" : ""} ${index > 1 ? "border-t border-border sm:border-t-0" : ""} ${index === 2 ? "sm:border-l" : ""}`}
                >
                  <dt className="text-xs text-muted sm:text-sm">{stat.label}</dt>
                  <dd className="font-display text-4xl font-semibold tracking-tight text-accent-strong tabular-nums sm:text-5xl">{stat.value}</dd>
                </div>
              ))}
            </dl>

            <a href="#services" className="group mx-auto mt-8 hidden flex-col items-center gap-2 text-xs font-semibold tracking-[0.3em] text-muted uppercase hover:text-foreground sm:flex">
              Scroll
              <span aria-hidden="true" className="relative h-10 w-px overflow-hidden bg-border">
                <span className="scroll-cue absolute inset-x-0 top-0 h-4 bg-accent" />
              </span>
            </a>
          </div>
        </section>

        {/* Outlined running type, a nod to the brochure covers. Decorative: the services are listed below. */}
        <div aria-hidden="true" className="overflow-hidden border-y border-border py-6 select-none">
          <div className="flex w-max motion-safe:animate-marquee [--marquee-duration:70s]">
            {[0, 1].map((copy) => (
              <p key={copy} className="flex shrink-0 items-center font-display text-5xl font-bold tracking-tight uppercase sm:text-7xl">
                {DISCIPLINES.map((discipline) => (
                  <span key={discipline} className="flex items-center">
                    <span className="text-outline px-8">{discipline}</span>
                    <span className="text-3xl text-accent">✦</span>
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>

        {logos.length > 0 && (
          <section aria-labelledby="clients-heading" className="border-b border-border bg-surface py-12">
            <h2 id="clients-heading" className="mb-8 text-center font-sans text-xs font-semibold tracking-[0.32em] text-muted uppercase">
              Notable clients
            </h2>
            <ClientLogoMarquee logos={logos} />
          </section>
        )}

        <section aria-labelledby="about-heading" className="mx-auto grid w-full max-w-6xl items-center gap-16 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:py-32">
          <div className="reveal lg:col-span-7">
            <Eyebrow>Who we are</Eyebrow>
            <SectionHeading id="about-heading" className="text-balance">
              Built for brands that move with <em className="text-accent-strong">purpose</em> and speed
            </SectionHeading>
            <p className="mt-6 max-w-2xl text-lg text-pretty text-muted">
              We partner with local and international businesses on strategy-led social media, SEO, web development and
              design. Every campaign and platform we build starts with strategy, so creative decisions serve clear business
              goals rather than trends. Our style is bold, culturally attuned and rooted in the markets we serve, and sharp
              enough to work on a global stage.
            </p>
            <dl className="reveal-stagger mt-10 divide-y divide-border border-y border-border">
              {PILLARS.map((pillar) => (
                <div key={pillar.title} className="grid gap-2 py-5 sm:grid-cols-[9rem_1fr] sm:gap-6">
                  <dt className="font-display text-2xl font-semibold">{pillar.title}</dt>
                  <dd className="text-muted">{pillar.body}</dd>
                </div>
              ))}
            </dl>
            <Link href="/about" className="link-sweep mt-8 inline-block pb-1 font-semibold">
              More about the crew →
            </Link>
          </div>
          {/* The photo with a note overlapping its corner, so the two read as one layered block. */}
          <div className="reveal relative pb-10 lg:col-span-5 lg:pb-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
              <Image src="/home/team.webp" alt="A team meeting around a table" fill sizes="(min-width: 1024px) 460px, 100vw" className="object-cover" />
            </div>
            <div className="absolute right-4 -bottom-2 max-w-60 rounded-2xl bg-accent p-5 text-accent-foreground shadow-xl sm:-right-6 lg:right-auto lg:-bottom-8 lg:-left-10">
              <p className="font-display text-4xl font-bold">2022</p>
              <p className="mt-1 text-sm font-medium">Founded in Karachi, now working with brands across three markets.</p>
            </div>
          </div>
        </section>

        <section id="services" aria-labelledby="services-heading" className="scroll-mt-20 bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
            <div className="reveal flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <Eyebrow>What we do</Eyebrow>
                <SectionHeading id="services-heading">
                  Ten disciplines. <em className="text-accent-strong">One</em> integrated crew.
                </SectionHeading>
              </div>
              <Link href="/services" className="link-sweep shrink-0 self-start pb-1 font-semibold md:self-auto">
                All services →
              </Link>
            </div>
            {/* The brochure's ten services as a two-column index; each row opens its section on /services. */}
            <ol className="reveal-stagger mt-14 grid border-t border-border md:grid-cols-2 md:gap-x-12">
              {SERVICE_DETAILS.map((service, index) => (
                <li key={service.id} className="border-b border-border">
                  <Link href={`/services#${service.id}`} className="group flex items-start gap-5 py-6">
                    <span className="mt-2 text-xs font-semibold tracking-[0.2em] text-accent-strong tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">
                      <span className="block font-display text-2xl transition-transform duration-500 ease-out motion-safe:group-hover:translate-x-1.5 sm:text-3xl">
                        {service.name}
                      </span>
                      <span className="mt-1.5 block text-sm text-muted">{service.summary}</span>
                    </span>
                    <span aria-hidden="true" className="mt-2 text-xl text-muted transition duration-300 group-hover:translate-x-1 group-hover:text-accent-strong">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="process-heading" className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="reveal lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
              <Eyebrow>How we work</Eyebrow>
              <SectionHeading id="process-heading" className="text-balance">
                A repeatable process behind <em className="text-accent-strong">every</em> account
              </SectionHeading>
              <p className="mt-6 max-w-sm text-pretty text-muted">
                Four steps, run every cycle, so each month builds on what the last one taught us.
              </p>
            </div>
            {/* The steps happen in this order, so they're numbered. Each card fills with gold on hover. */}
            <ol className="reveal-stagger grid gap-4 sm:grid-cols-2 lg:col-span-8">
              {PROCESS.map((step, index) => (
                <li
                  key={step.title}
                  className="lift group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface p-7 hover:border-accent/60"
                >
                  <span aria-hidden="true" className="text-outline font-display text-7xl leading-none font-bold transition-colors duration-500 group-hover:text-accent">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-semibold tracking-tight">{step.title}</h3>
                    <p className="mt-2 text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="industries-heading" className="border-y border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
            <div className="reveal flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <Eyebrow>Where we&apos;ve worked</Eyebrow>
                <SectionHeading id="industries-heading" className="max-w-3xl text-balance">
                  Cross-industry experience, not a <em className="text-accent-strong">one-vertical</em> playbook
                </SectionHeading>
              </div>
              <Link href="/work" className="link-sweep shrink-0 self-start pb-1 font-semibold md:self-auto">
                See the work →
              </Link>
            </div>
            {/* Tiles rather than a long list; the linked ones carry an arrow and lift on hover. */}
            <ul className="reveal-stagger mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {INDUSTRIES.map((industry, index) => (
                <li
                  key={industry.name}
                  className={`group relative flex min-h-44 flex-col justify-between gap-6 rounded-3xl border border-border bg-background p-6 ${
                    industry.href ? "lift hover:border-accent/60" : ""
                  } ${index === 0 ? "lg:col-span-2" : ""}`}
                >
                  <span className="text-xs font-semibold tracking-[0.2em] text-accent-strong tabular-nums">0{index + 1}</span>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl font-semibold tracking-tight">
                        {industry.href ? (
                          <Link href={industry.href} className="after:absolute after:inset-0">
                            {industry.name}
                          </Link>
                        ) : (
                          industry.name
                        )}
                      </h3>
                      <p className="mt-1 text-sm text-muted">{industry.detail}</p>
                    </div>
                    {industry.href && (
                      <span
                        aria-hidden="true"
                        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border transition duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground"
                      >
                        →
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="story-heading" className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
          <Eyebrow>Our journey</Eyebrow>
          <SectionHeading id="story-heading" className="reveal max-w-3xl text-balance">
            From a small startup to a <em className="text-accent-strong">full-service</em> crew
          </SectionHeading>
          {/* A horizontal timeline: the rule draws itself in, each year sits on a dot. */}
          <ol className="reveal-stagger relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            <span aria-hidden="true" className="draw-x absolute top-1.5 right-0 left-0 hidden h-px bg-linear-to-r from-accent via-flame to-brand-purple lg:block" />
            {JOURNEY.map((stop) => (
              <li key={stop.year} className="relative border-l border-border pl-5 lg:border-l-0 lg:pt-10 lg:pl-0">
                <span aria-hidden="true" className="absolute top-0 left-0 hidden size-3 rounded-full bg-accent ring-4 ring-background lg:block" />
                <p className="font-display text-5xl font-semibold tracking-tight text-accent-strong tabular-nums">{stop.year}</p>
                <h3 className="mt-3 font-semibold">{stop.title}</h3>
                <p className="mt-1 text-sm text-muted">{stop.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {testimonials.length > 0 && (
          <section className="border-t border-border bg-surface">
            <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
              <Eyebrow>What clients say</Eyebrow>
              <SectionHeading id="testimonials-heading">
                In their <em className="text-accent-strong">words</em>
              </SectionHeading>
              <div className="reveal mt-12">
                <TestimonialsCarousel testimonials={testimonials} labelledBy="testimonials-heading" />
              </div>
            </div>
          </section>
        )}

        <section aria-labelledby="hello-heading" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="reveal flex flex-col gap-6 rounded-3xl border border-border p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="hello-heading" className="text-3xl">
                Not ready to start a project yet?
              </h2>
              <p className="mt-1 text-muted">
                Say hello on Instagram{" "}
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-4">
                  @itsbuzzcrew<span className="sr-only"> (opens in a new tab)</span>
                </a>{" "}
                or at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground underline underline-offset-4">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>
            <Link href="/faq" className="press shrink-0 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:border-accent hover:text-accent-strong">
              Read the FAQ
            </Link>
          </div>
        </section>
      </main>
      <CtaBand />
    </>
  );
}
