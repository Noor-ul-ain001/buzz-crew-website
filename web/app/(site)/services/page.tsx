import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import CtaBand from "@/components/CtaBand";
import StartProjectButton from "@/components/inquiry/StartProjectButton";
import { pageMetadata } from "@/lib/metadata";
import type { SERVICES as INQUIRY_SERVICES } from "@/lib/validation/inquiry";

export const metadata: Metadata = pageMetadata({
  title: "Digital marketing services",
  description:
    "Social media, SEO, web and software development, UI/UX design and Meta Ads from The Buzz Crew, a full-service agency in Karachi working worldwide.",
  path: "/services",
});

type Service = {
  id: string;
  number: string;
  // Matches the inquiry form's options, so each service can pre-select itself there.
  name: (typeof INQUIRY_SERVICES)[number];
  image: string;
  alt: string;
  summary: string;
  outcomes: string[];
};

const SERVICES: Service[] = [
  {
    id: "social-media",
    number: "01",
    name: "Social Media",
    image: "/home/camera.webp",
    alt: "Filming a band on a camera monitor",
    summary: "Make your brand part of the conversation, with content people want to stop for and a plan that turns attention into action.",
    outcomes: ["Channel and content strategy", "Creative direction and production", "Community management", "Monthly reporting and optimisation"],
  },
  {
    id: "seo",
    number: "02",
    name: "SEO",
    image: "/home/automation.webp",
    alt: "Diagram of an automated process",
    summary: "Get found by the people already looking for you. We turn technical foundations, useful content and local relevance into lasting visibility.",
    outcomes: ["Technical and content audits", "Keyword and competitor research", "On-page and local SEO", "Search performance reporting"],
  },
  {
    id: "web-and-software",
    number: "03",
    name: "Web & Software",
    image: "/home/code.webp",
    alt: "Code on a laptop beside a mug",
    summary: "Websites and custom tools that work as hard as your business: fast, considered, easy to use and built to keep up.",
    outcomes: ["Marketing websites", "E-commerce experiences", "Custom platforms and portals", "Ongoing maintenance and support"],
  },
  {
    id: "ui-ux-design",
    number: "04",
    name: "UI/UX Design",
    image: "/home/tablet.webp",
    alt: "Designer sketching screens on a tablet",
    summary: "Turn complex journeys into clear, confident experiences that give people a reason to stay, explore and convert.",
    outcomes: ["User journeys and information architecture", "Wireframes and prototypes", "Visual systems", "Usability-led iteration"],
  },
  {
    id: "meta-ads",
    number: "05",
    name: "Meta Ads",
    image: "/home/magazines.webp",
    alt: "Hands leafing through magazines on a desk",
    summary: "Put the right message in front of the right audience, then keep learning until budget is working harder for your business.",
    outcomes: ["Campaign and funnel strategy", "Audience targeting", "Creative and copy testing", "Performance measurement"],
  },
];

const EXTRAS = ["Branding", "Copywriting", "Video and content production", "Public relations", "AI and automation", "IoT and smart digital solutions"];
const PROCESS = [
  ["Discover", "We get close to your goals, audience, market and existing activity."],
  ["Define", "Together, we shape a focused plan with priorities, milestones and measures."],
  ["Create", "Our crew makes, launches and manages the work across the right channels."],
  ["Improve", "We report clearly, learn quickly and build on the moves that make an impact."],
] as const;

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold tracking-[0.32em] text-accent-strong uppercase">{children}</p>;
}

export default function ServicesPage() {
  return (
    <>
      <main className="flex-1">
        <section className="relative isolate overflow-hidden border-b border-border bg-surface">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,color-mix(in_oklab,var(--brand-purple)_22%,transparent),transparent_30rem)]" />
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <div className="rise">
                <Eyebrow>Services</Eyebrow>
              </div>
              <h1 className="rise mt-5 max-w-4xl text-6xl leading-[0.95] tracking-tight text-balance [--d:1] sm:text-8xl">
                The right specialists, moving in the <em className="text-accent-strong">same</em> direction.
              </h1>
              <p className="rise mt-7 max-w-xl text-lg leading-8 text-pretty text-muted [--d:2]">
                One team for the strategy, creative, technology and media your brand needs to move from busy to genuinely growing.
              </p>
            </div>
            {/* A jump index to each service further down the page. */}
            <nav aria-label="Services on this page" className="rise [--d:3] lg:col-span-4">
              <ol className="border-t border-border">
                {SERVICES.map((service) => (
                  <li key={service.id} className="border-b border-border">
                    <a href={`#${service.id}`} className="group flex items-center justify-between gap-4 py-3.5 font-medium">
                      <span className="flex items-baseline gap-4">
                        <span className="text-xs font-semibold tracking-[0.2em] text-accent-strong tabular-nums">{service.number}</span>
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

        <section aria-labelledby="services-heading" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-32">
          <div className="reveal flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>Core capabilities</Eyebrow>
              <h2 id="services-heading" className="mt-4 text-5xl leading-[1.03] tracking-tight sm:text-6xl">
                Built around the whole journey.
              </h2>
            </div>
            <p className="max-w-md text-pretty text-muted">Choose one focused service or bring us in as an integrated extension of your team.</p>
          </div>
          {/* Alternating photo and text, so the page reads as a sequence rather than a grid of cards. */}
          <ol className="mt-20 flex flex-col gap-24 lg:gap-32">
            {SERVICES.map((service, index) => (
              <li key={service.id} id={service.id} className="group grid scroll-mt-28 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={`reveal relative ${index % 2 === 1 ? "lg:order-last" : ""}`}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-surface">
                    <Image
                      src={service.image}
                      alt={service.alt}
                      fill
                      sizes="(min-width: 1024px) 540px, 100vw"
                      className="object-cover transition-transform duration-1000 ease-out motion-safe:group-hover:scale-105"
                    />
                  </div>
                  <span
                    aria-hidden="true"
                    className={`text-outline absolute -top-12 font-display text-8xl font-bold sm:-top-14 sm:text-9xl ${index % 2 === 1 ? "right-4" : "left-4"}`}
                  >
                    {service.number}
                  </span>
                </div>
                <div className="reveal">
                  <h3 className="text-5xl leading-none font-semibold tracking-tight">{service.name}</h3>
                  <p className="mt-5 max-w-xl text-lg leading-8 text-pretty text-muted">{service.summary}</p>
                  <ul className="mt-8 grid gap-x-6 border-t border-border text-sm sm:grid-cols-2">
                    {service.outcomes.map((outcome) => (
                      <li key={outcome} className="flex items-center gap-3 border-b border-border py-3">
                        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-flame" />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                  <StartProjectButton
                    services={[service.name]}
                    className="group/cta mt-8 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold hover:border-accent hover:text-accent-strong"
                  >
                    Start a {service.name} project
                    <span aria-hidden="true" className="transition-transform duration-300 group-hover/cta:translate-x-1">
                      →
                    </span>
                  </StartProjectButton>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="extras-heading" className="border-y border-border bg-ink text-white">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
            <div className="reveal">
              <Eyebrow>More ways we help</Eyebrow>
              <h2 id="extras-heading" className="mt-4 text-5xl leading-[1.03] tracking-tight text-balance sm:text-6xl">
                Extra firepower when the brief calls for it.
              </h2>
            </div>
            <ul className="reveal-stagger flex flex-wrap content-start gap-3 lg:pt-3">
              {EXTRAS.map((extra) => (
                <li key={extra} className="rounded-full border border-white/25 px-5 py-3 text-sm font-medium text-white/90 transition-colors duration-300 hover:border-accent hover:text-accent">
                  {extra}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="process-heading" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-32">
          <div className="reveal">
            <Eyebrow>How engagement works</Eyebrow>
            <h2 id="process-heading" className="mt-4 max-w-3xl text-5xl leading-[1.03] tracking-tight text-balance sm:text-6xl">
              A simple process that keeps good work moving.
            </h2>
          </div>
          <ol className="reveal-stagger relative mt-16 grid gap-10 md:grid-cols-4 md:gap-8">
            <span aria-hidden="true" className="draw-x absolute top-0 right-0 left-0 hidden h-px bg-linear-to-r from-accent via-flame to-brand-purple md:block" />
            {PROCESS.map(([title, body], index) => (
              <li key={title} className="relative border-t border-border pt-6 md:border-t-0">
                <span aria-hidden="true" className="absolute -top-1 left-0 hidden size-2 rounded-full bg-accent md:block" />
                <p className="text-sm font-semibold tracking-[0.2em] text-accent-strong tabular-nums">0{index + 1}</p>
                <h3 className="mt-6 text-3xl font-semibold tracking-tight">{title}</h3>
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
      <CtaBand heading="Let's put the right work in motion." body="Tell us what you are building, fixing or growing. We will bring the people and plan to match." />
    </>
  );
}
