import Image from "next/image";
import Link from "next/link";
import StartProjectButton from "@/components/inquiry/StartProjectButton";

// Closing call to action for long pages. Always dark ink with the brand gradient hairline,
// in both themes, so the yellow button reads as the next step.
export default function CtaBand({
  heading = "Let's create stories worth remembering.",
  body = "Available for worldwide collaborations. Tell us about your brand and the crew will reply within 24 hours.",
}: {
  heading?: string;
  body?: string;
}) {
  return (
    <section aria-labelledby="cta-heading" className="relative isolate overflow-hidden bg-ink text-white">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-accent via-flame to-brand-purple" />
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={338}
        height={305}
        className="float pointer-events-none absolute -right-16 -bottom-24 -z-10 hidden w-[26rem] opacity-20 md:block"
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="reveal max-w-2xl">
          <h2 id="cta-heading" className="text-4xl font-bold tracking-tight sm:text-5xl">
            {heading}
          </h2>
          <p className="mt-4 text-lg text-white/75">{body}</p>
        </div>
        <div className="reveal flex flex-wrap gap-3">
          <StartProjectButton className="rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-foreground hover:brightness-95" />
          <Link href="/contact" className="press rounded-full border border-white/40 px-7 py-3.5 font-medium hover:border-white">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
