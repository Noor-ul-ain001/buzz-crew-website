"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { useLeads } from "@/components/admin/LeadsProvider";
import PriorityBadge from "@/components/admin/PriorityBadge";
import ServiceChips from "@/components/admin/ServiceChips";
import StatusBadge from "@/components/admin/StatusBadge";
import { downloadCsv, leadsToCsv } from "@/lib/leads/csv";
import {
  EMPTY_FILTERS,
  PAGE_SIZE,
  filterLeads,
  hasActiveFilters,
  leadFiltersQuery,
  type LeadFilters,
} from "@/lib/leads/filters";
import { formatDate, toBusinessDay } from "@/lib/format";
import { scoreLead } from "@/lib/leads/scoring";
import { LEAD_STATUSES } from "@/lib/leads/types";
import { COUNTRIES, SERVICES } from "@/lib/validation/inquiry";

const SEARCH_DEBOUNCE_MS = 300;

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted";

// The URL is the source of truth for filters and page: the server page parses them and
// passes them in, and every change here is written back with router.replace.
export default function LeadsTable({ filters }: { filters: LeadFilters }) {
  const router = useRouter();
  const { leads } = useLeads();
  const [isPending, startTransition] = useTransition();
  const ids = { search: useId(), status: useId(), service: useId(), country: useId(), from: useId(), to: useId() };

  function navigate(next: LeadFilters) {
    startTransition(() => {
      router.replace(`/admin/leads${leadFiltersQuery(next)}`, { scroll: false });
    });
  }

  function setFilter<K extends Exclude<keyof LeadFilters, "page">>(key: K, value: LeadFilters[K]) {
    navigate({ ...filters, [key]: value, page: 1 });
  }

  // Search is typed locally and written to the URL after a pause. When the URL changes
  // from elsewhere (Back button, "Clear filters"), the box follows it.
  const [query, setQuery] = useState(filters.q);
  const [syncedQ, setSyncedQ] = useState(filters.q);
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q);
    if (filters.q !== query.trim()) setQuery(filters.q);
  }

  useEffect(() => {
    if (query.trim() === filters.q) return;
    const timer = setTimeout(() => {
      startTransition(() => {
        router.replace(`/admin/leads${leadFiltersQuery({ ...filters, q: query.trim(), page: 1 })}`, {
          scroll: false,
        });
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, filters, router]);

  function clearFilters() {
    setQuery("");
    navigate(EMPTY_FILTERS);
  }

  const matching = filterLeads(leads, filters);
  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const start = (page - 1) * PAGE_SIZE;
  const rows = matching.slice(start, start + PAGE_SIZE);
  const active = hasActiveFilters(filters);

  function exportCsv() {
    downloadCsv(`buzz-crew-leads-${toBusinessDay(new Date().toISOString())}.csv`, leadsToCsv(matching));
  }

  return (
    <div className="mt-6">
      <div role="search" aria-label="Filter leads" className="rounded-2xl border border-border p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-6">
            <label htmlFor={ids.search} className={labelClass}>
              Search
            </label>
            <input
              id={ids.search}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, business, email or phone"
              autoComplete="off"
              className={fieldClass}
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor={ids.status} className={labelClass}>
              Status
            </label>
            <select
              id={ids.status}
              value={filters.status}
              onChange={(event) => setFilter("status", event.target.value as LeadFilters["status"])}
              className={fieldClass}
            >
              <option value="">All statuses</option>
              {LEAD_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label htmlFor={ids.service} className={labelClass}>
              Service
            </label>
            <select
              id={ids.service}
              value={filters.service}
              onChange={(event) => setFilter("service", event.target.value as LeadFilters["service"])}
              className={fieldClass}
            >
              <option value="">All services</option>
              {SERVICES.map((service) => (
                <option key={service}>{service}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor={ids.country} className={labelClass}>
              Country
            </label>
            <select
              id={ids.country}
              value={filters.country}
              onChange={(event) => setFilter("country", event.target.value as LeadFilters["country"])}
              className={fieldClass}
            >
              <option value="">All countries</option>
              {COUNTRIES.map((country) => (
                <option key={country}>{country}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-3">
            <label htmlFor={ids.from} className={labelClass}>
              Received from
            </label>
            <input
              id={ids.from}
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(event) => setFilter("from", event.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="lg:col-span-3">
            <label htmlFor={ids.to} className={labelClass}>
              Received to
            </label>
            <input
              id={ids.to}
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(event) => setFilter("to", event.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-muted">
          {matching.length === 0
            ? "No leads found"
            : `Showing ${start + 1}–${start + rows.length} of ${matching.length} ${matching.length === 1 ? "lead" : "leads"}`}
          {active && " matching your filters"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {active && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full px-4 py-2 text-sm font-medium underline-offset-4 hover:underline"
            >
              Clear filters
            </button>
          )}
          <button
            type="button"
            onClick={exportCsv}
            disabled={matching.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-foreground px-4 py-2 text-sm font-semibold hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
            </svg>
            Export CSV
            <span className="sr-only"> of {matching.length} {matching.length === 1 ? "lead" : "leads"}</span>
          </button>
        </div>
      </div>

      <div className={`mt-4 transition-opacity ${isPending ? "opacity-60" : ""}`}>
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="font-semibold">No leads match these filters.</p>
            <p className="mt-1 text-sm text-muted">Try a different search or widen the date range.</p>
            {active && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Leads, newest first</caption>
                <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Lead</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Country</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Services</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Budget</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Priority <span className="font-normal normal-case">(AI)</span>
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((lead) => (
                    // The name link is stretched over the whole row, so any part of it opens the lead.
                    <tr key={lead.id} className="relative align-top hover:bg-surface has-[a:focus-visible]:bg-surface">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="font-semibold after:absolute after:inset-0 focus-visible:outline-none"
                        >
                          {lead.name}
                        </Link>
                        <p className="text-muted">{lead.business || "No business name"}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{lead.country}</td>
                      <td className="px-4 py-3">
                        <ServiceChips services={lead.services} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{lead.budget}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge score={scoreLead(lead)} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted">
                        <time dateTime={lead.createdAt}>{formatDate(lead.createdAt)}</time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {rows.map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="block rounded-2xl border border-border p-4 hover:bg-surface"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{lead.name}</p>
                        <p className="truncate text-sm text-muted">{lead.business || "No business name"}</p>
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>
                    <div className="mt-3">
                      <ServiceChips services={lead.services} />
                    </div>
                    <div className="mt-3">
                      <PriorityBadge score={scoreLead(lead)} variant="static" />
                    </div>
                    <p className="mt-3 text-sm text-muted">
                      {lead.country} · {lead.budget} ·{" "}
                      <time dateTime={lead.createdAt}>{formatDate(lead.createdAt)}</time>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3">
          <PageLink filters={filters} page={page - 1} disabled={page <= 1}>
            ← Previous
          </PageLink>
          <p className="text-sm text-muted">
            Page {page} of {pageCount}
          </p>
          <PageLink filters={filters} page={page + 1} disabled={page >= pageCount}>
            Next →
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  filters,
  page,
  disabled,
  children,
}: {
  filters: LeadFilters;
  page: number;
  disabled: boolean;
  children: string;
}) {
  const className = "rounded-full border border-border px-4 py-2 text-sm font-medium";
  if (disabled) {
    return (
      <span aria-disabled="true" className={`${className} opacity-40`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={`/admin/leads${leadFiltersQuery({ ...filters, page })}`} scroll={false} className={`${className} hover:bg-surface`}>
      {children}
    </Link>
  );
}
