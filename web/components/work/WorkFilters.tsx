"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { Schemas } from "@/lib/api/client";
import { track } from "@/lib/analytics";
import { workHref, type WorkFilters as Filters } from "@/lib/content/work-filters";
import { INDUSTRY_LABELS, SERVICE_LABELS, type ApiService, type Industry } from "@/lib/content/work-labels";

const pillClass =
  "press inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium hover:border-accent aria-[current=true]:border-foreground aria-[current=true]:bg-foreground aria-[current=true]:text-background";

function Pending() {
  // Shows while the new results load; the previous ones stay on screen meanwhile.
  const { pending } = useLinkStatus();
  return pending ? <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-current" /> : null;
}

// Filters are links, so each view has its own shareable address and Back works (005 US4/US5).
// Only options with at least one published case study are offered, each with its count.
export default function WorkFilters({ filters, facets }: { filters: Filters; facets: Schemas["Facets"] }) {
  const industries = facets.industries.filter((facet) => facet.count > 0);
  const services = facets.services.filter((facet) => facet.count > 0);

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Filter by industry" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <p aria-hidden="true" className="w-20 shrink-0 text-xs font-semibold tracking-[0.2em] text-muted uppercase">
          Industry
        </p>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link href={workHref({ service: filters.service })} replace scroll={false} aria-current={filters.industry === null} className={pillClass}>
              All industries
            </Link>
          </li>
          {industries.map((facet) => {
            const value = facet.value as Industry;
            return (
              <li key={value}>
                <Link
                  href={workHref({ industry: value, service: filters.service })}
                  replace
                  scroll={false}
                  aria-current={filters.industry === value}
                  onClick={() => track("work_filter_used", { filter: "industry" })}
                  className={pillClass}
                >
                  {INDUSTRY_LABELS[value]} <span className="opacity-70">({facet.count})</span>
                  <Pending />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <nav aria-label="Filter by service" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <p aria-hidden="true" className="w-20 shrink-0 text-xs font-semibold tracking-[0.2em] text-muted uppercase">
          Service
        </p>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link href={workHref({ industry: filters.industry })} replace scroll={false} aria-current={filters.service === null} className={pillClass}>
              All services
            </Link>
          </li>
          {services.map((facet) => {
            const value = facet.value as ApiService;
            return (
              <li key={value}>
                <Link
                  href={workHref({ industry: filters.industry, service: value })}
                  replace
                  scroll={false}
                  aria-current={filters.service === value}
                  onClick={() => track("work_filter_used", { filter: "service" })}
                  className={pillClass}
                >
                  {SERVICE_LABELS[value]} <span className="opacity-70">({facet.count})</span>
                  <Pending />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
