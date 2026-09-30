import Link from "next/link";
import Logo from "@/components/Logo";
import CookieSettingsButton from "@/components/consent/CookieSettingsButton";
import NewsletterSignup from "@/components/NewsletterSignup";
import { getIndustries } from "@/lib/data/industries";
import { CONTACT_EMAIL, INSTAGRAM_URL, NAV_LINKS, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { SERVICE_DETAILS } from "@/lib/services";

const headingClass = "text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong";
// Muted links brighten and draw an underline on hover (see .link-sweep in globals.css).
const linkClass = "link-sweep pb-0.5 text-muted transition-colors duration-200 hover:text-foreground";

const TOOLS = [
  { href: "/tools/seo-audit", label: "Free SEO audit" },
  { href: "/tools/captions", label: "Caption ideas" },
  { href: "/faq", label: "FAQ" },
];

export default async function SiteFooter() {
  const industries = await getIndustries();

  return (
    // Bottom padding keeps the fixed chat and WhatsApp buttons clear of the footer text.
    <footer className="relative mt-auto overflow-hidden bg-surface pb-36 sm:pb-32">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-accent via-brand-teal to-brand-purple" />

      {/* Contact strip: the two ways to reach the crew, as large links. */}
      <div className="mx-auto flex max-w-6xl flex-col gap-6 border-b border-border px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className={headingClass}>Say hello</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="group mt-3 inline-flex items-center gap-3 font-display text-3xl font-semibold tracking-tight break-all transition-colors duration-300 hover:text-accent-strong sm:text-5xl"
          >
            {CONTACT_EMAIL}
            <span aria-hidden="true" className="text-2xl transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 sm:text-4xl">
              ↗
            </span>
          </a>
        </div>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="press inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-border px-5 py-2.5 font-medium hover:border-accent hover:text-accent-strong md:self-auto"
        >
          @itsbuzzcrew on Instagram<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-12">
        <div className="flex flex-col gap-8 sm:col-span-2 lg:col-span-4">
          <div className="flex flex-col gap-3">
            <Link href="/" aria-label={`${SITE_NAME}, home`} className="self-start rounded-md transition-opacity hover:opacity-80">
              <Logo />
            </Link>
            <p className="text-muted">{SITE_TAGLINE}</p>
            <p className="text-sm text-muted">Karachi · Serving Pakistan, the UAE and the UK</p>
          </div>
          <NewsletterSignup />
        </div>

        <nav aria-labelledby="footer-nav-heading" className="lg:col-span-2 lg:col-start-6">
          <h2 id="footer-nav-heading" className={headingClass}>
            Navigate
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-services-heading" className="lg:col-span-2">
          <h2 id="footer-services-heading" className={headingClass}>
            Services
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {SERVICE_DETAILS.map((service) => (
              <li key={service.id}>
                <Link href={`/services#${service.id}`} className={linkClass}>
                  {service.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-resources-heading" className="sm:col-span-2 lg:col-span-3">
          <h2 id="footer-resources-heading" className={headingClass}>
            Resources
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link href={tool.href} className={linkClass}>
                  {tool.label}
                </Link>
              </li>
            ))}
            {industries.map((industry) => (
              <li key={industry.slug}>
                <Link href={`/industries/${industry.slug}`} className={linkClass}>
                  {industry.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Oversized outlined wordmark, echoing the running type on the home page. */}
      <p
        aria-hidden="true"
        className="text-outline mx-auto mt-16 max-w-6xl px-4 text-center font-display text-[13vw] leading-none font-bold tracking-tighter whitespace-nowrap uppercase transition-colors duration-700 select-none hover:text-accent/15 sm:px-6 lg:text-[9.5rem]"
      >
        The Buzz Crew
      </p>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-4 border-t border-border px-4 pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <li>
            <Link href="/privacy" className={linkClass}>
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/terms" className={linkClass}>
              Terms of Service
            </Link>
          </li>
          <li>
            <CookieSettingsButton className={linkClass} />
          </li>
          <li>
            <a href="#" className="group inline-flex items-center gap-1.5 font-medium text-foreground">
              Back to top
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5">
                ↑
              </span>
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
