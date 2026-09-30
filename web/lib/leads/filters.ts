import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/leads/types";
import { toBusinessDay } from "@/lib/format";
import { COUNTRIES, SERVICES } from "@/lib/validation/inquiry";

export const PAGE_SIZE = 10;

export type LeadFilters = {
  q: string;
  status: LeadStatus | "";
  service: (typeof SERVICES)[number] | "";
  country: (typeof COUNTRIES)[number] | "";
  /** Inclusive YYYY-MM-DD bounds on the created date. */
  from: string;
  to: string;
  page: number;
};

export const EMPTY_FILTERS: LeadFilters = {
  q: "",
  status: "",
  service: "",
  country: "",
  from: "",
  to: "",
  page: 1,
};

type SearchParams = Record<string, string | string[] | undefined>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function oneOf<T extends string>(value: string, options: readonly T[]): T | "" {
  return (options as readonly string[]).includes(value) ? (value as T) : "";
}

// Unknown or malformed values are dropped rather than erroring, so a hand-edited URL
// still shows a sensible table.
export function parseLeadFilters(params: SearchParams): LeadFilters {
  const page = Number.parseInt(first(params.page), 10);
  const from = first(params.from);
  const to = first(params.to);
  return {
    q: first(params.q).trim().slice(0, 100),
    status: oneOf(first(params.status), LEAD_STATUSES),
    service: oneOf(first(params.service), SERVICES),
    country: oneOf(first(params.country), COUNTRIES),
    from: DATE_PATTERN.test(from) ? from : "",
    to: DATE_PATTERN.test(to) ? to : "",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Query string for the given filters, omitting empty values and page 1. */
export function leadFiltersQuery(filters: LeadFilters): string {
  const params = new URLSearchParams();
  for (const key of ["q", "status", "service", "country", "from", "to"] as const) {
    if (filters[key]) params.set(key, filters[key]);
  }
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function hasActiveFilters(filters: LeadFilters) {
  return Boolean(
    filters.q || filters.status || filters.service || filters.country || filters.from || filters.to,
  );
}

export function filterLeads(leads: Lead[], filters: LeadFilters): Lead[] {
  const q = filters.q.toLowerCase();
  return leads.filter((lead) => {
    if (
      q &&
      ![lead.name, lead.business, lead.email, lead.phone].some((field) =>
        field.toLowerCase().includes(q),
      )
    ) {
      return false;
    }
    if (filters.status && lead.status !== filters.status) return false;
    if (filters.service && !lead.services.includes(filters.service)) return false;
    if (filters.country && lead.country !== filters.country) return false;
    const day = toBusinessDay(lead.createdAt);
    if (filters.from && day < filters.from) return false;
    if (filters.to && day > filters.to) return false;
    return true;
  });
}
