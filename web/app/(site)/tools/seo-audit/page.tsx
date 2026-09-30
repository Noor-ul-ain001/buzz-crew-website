import SeoAuditTool from "@/components/seo-audit/SeoAuditTool";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Free SEO audit tool",
  description:
    "Check your website's speed, SEO and accessibility in seconds. Free SEO audit with Core Web Vitals, on-page checks and a plain-English summary of what to fix.",
  path: "/tools/seo-audit",
});

const WHAT_WE_CHECK = [
  { title: "Speed", body: "Core Web Vitals on mobile: how fast your page appears and responds." },
  { title: "On-page SEO", body: "Titles, meta descriptions, headings, canonical tags and more." },
  { title: "Accessibility", body: "Alt text, heading order and other basics that help every visitor." },
  { title: "What to fix first", body: "A short summary of the changes that will make the biggest difference." },
];

export default function SeoAuditPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-4xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">Free tool</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance sm:text-6xl">How healthy is your website?</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted sm:text-xl">
          Enter your website address for a free audit of speed, SEO and accessibility, with a plain-English list of what to
          fix first. It takes about ten seconds and you don&apos;t need to sign up.
        </p>
        <div className="mt-10">
          <SeoAuditTool />
        </div>
      </section>

      <section aria-labelledby="checks-heading" className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
        <h2 id="checks-heading" className="text-2xl font-bold tracking-tight">
          What the audit checks
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {WHAT_WE_CHECK.map((item) => (
            <li key={item.title} className="rounded-2xl border border-border p-5">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
