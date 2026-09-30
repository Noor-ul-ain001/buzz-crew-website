import type { ReactNode } from "react";
import CopyButton from "@/components/ui/CopyButton";
import InquiryForm from "@/components/inquiry/InquiryForm";
import { pageMetadata } from "@/lib/metadata";
import { CONTACT_EMAIL, INSTAGRAM_URL } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Start a project with The Buzz Crew, a full-service digital agency in Karachi working with brands in Pakistan, the UAE and the UK. We reply within 24 hours.",
  path: "/contact",
});

const NEXT_STEPS = [
  { title: "We reply within 24 hours", body: "A real person from the crew reads your message and gets back to you." },
  { title: "A short discovery call", body: "We learn about your goals, audience and what has or hasn't worked so far." },
  { title: "A clear plan and quote", body: "You get a focused plan with priorities, timelines and a fixed quote." },
];

function Channel({ label, href, value, external = false, children }: { label: string; href: string; value: string; external?: boolean; children?: ReactNode }) {
  return (
    <li className="group relative flex items-center justify-between gap-4 border-b border-border py-5">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">{label}</p>
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="relative mt-1 block font-display min-[360px]:truncate text-xl font-semibold tracking-tight transition-colors group-hover:text-accent-strong sm:text-2xl"
        >
          {value}
          {external && <span className="sr-only"> (opens in a new tab)</span>}
        </a>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {children}
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full border border-border transition duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground"
        >
          ↗
        </span>
      </div>
    </li>
  );
}

export default function ContactPage() {
  return (
    <main className="flex-1">
      <section className="relative isolate overflow-hidden border-b border-border">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_0%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_28rem)]" />
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
          <p className="rise text-xs font-semibold tracking-[0.32em] text-accent-strong uppercase">Contact</p>
          <h1 className="rise mt-5 max-w-4xl text-6xl leading-[0.95] tracking-tight text-balance [--d:1] sm:text-8xl">
            Let&apos;s talk about what&apos;s <em className="text-accent-strong">next.</em>
          </h1>
          <p className="rise mt-7 max-w-xl text-lg leading-8 text-pretty text-muted [--d:2]">
            Tell us about your business and where you want to grow. The crew reads every message and replies within 24 hours.
          </p>
          <p className="rise mt-8 inline-flex items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium [--d:3]">
            <span aria-hidden="true" className="relative flex size-2.5">
              <span className="absolute inline-flex size-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            Taking on new projects · Karachi, working worldwide
          </p>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:py-24">
        {/* Contact details stay beside the form while it scrolls on large screens. */}
        <aside className="flex flex-col gap-12 lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <div className="reveal">
            <h2 className="text-xs font-semibold tracking-[0.32em] text-accent-strong uppercase">Reach the crew</h2>
            <ul className="mt-4 border-t border-border">
              <Channel label="Email" href={`mailto:${CONTACT_EMAIL}`} value={CONTACT_EMAIL}>
                <span className="hidden sm:block">
                  <CopyButton value={CONTACT_EMAIL} label="email address" />
                </span>
              </Channel>
              <Channel label="Instagram" href={INSTAGRAM_URL} value="@itsbuzzcrew" external />
            </ul>
          </div>

          <div className="reveal">
            <h2 className="text-xs font-semibold tracking-[0.32em] text-accent-strong uppercase">What happens next</h2>
            <ol className="mt-6 flex flex-col gap-6">
              {NEXT_STEPS.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-4">
                  <span className="flex size-10 items-center justify-center rounded-full border border-accent font-display font-semibold text-accent-strong tabular-nums">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <section aria-labelledby="inquiry-heading" className="reveal rounded-[2rem] border border-border bg-surface p-5 sm:p-10 lg:col-span-7">
          <h2 id="inquiry-heading" className="text-3xl font-semibold tracking-tight">
            Start a project
          </h2>
          <p className="mt-2 mb-8 text-muted">A few details help us come back with something useful. It takes about two minutes.</p>
          <InquiryForm />
        </section>
      </div>
    </main>
  );
}
