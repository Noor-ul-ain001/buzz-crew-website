import { BUSINESS_TIME_ZONE } from "@/lib/format";
import type { Lead, LeadCountry, LeadService } from "@/lib/leads/types";
import { COUNTRIES, SERVICES } from "@/lib/validation/inquiry";

/** "YYYY-MM" in the business time zone. */
function monthKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit" })
    .format(date)
    .slice(0, 7);
}

function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split("-").map(Number);
  // Mid-month at noon UTC is the same calendar month in any time zone.
  const date = new Date(Date.UTC(year, month - 1 + delta, 15, 12));
  return date.toISOString().slice(0, 7);
}

const MONTH_FORMATS = {
  short: { month: "short" }, // "Sep"
  name: { month: "long" }, // "September"
  full: { month: "long", year: "numeric" }, // "September 2026"
} as const;

function monthLabel(key: string, format: keyof typeof MONTH_FORMATS) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...MONTH_FORMATS[format] }).format(
    new Date(Date.UTC(year, month - 1, 15)),
  );
}

export type Breakdown<T extends string> = { label: T; count: number; share: number }[];

export type LeadStats = {
  monthName: string;
  previousMonthName: string;
  thisMonth: number;
  lastMonth: number;
  wonThisMonth: number;
  wonLastMonth: number;
  /** Won ÷ all leads, 0–1. */
  conversionRate: number;
  wonTotal: number;
  total: number;
  topService: { service: LeadService; count: number } | null;
  perMonth: { key: string; month: string; label: string; leads: number; current: boolean }[];
  byCountry: Breakdown<LeadCountry>;
  byService: Breakdown<LeadService>;
};

function breakdown<T extends string>(options: readonly T[], counts: Map<T, number>, total: number): Breakdown<T> {
  return options
    .map((label) => ({ label, count: counts.get(label) ?? 0, share: total ? (counts.get(label) ?? 0) / total : 0 }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function computeLeadStats(leads: Lead[], now: Date, months = 12): LeadStats {
  const current = monthKey(now);
  const previous = shiftMonth(current, -1);
  const createdIn = (key: string) => leads.filter((lead) => monthKey(new Date(lead.createdAt)) === key);
  const wonIn = (key: string) =>
    // Only leads still Won count, so a win that was later reversed isn't reported.
    leads.filter(
      (lead) =>
        lead.status === "Won" &&
        lead.events.some((event) => event.to === "Won" && monthKey(new Date(event.createdAt)) === key),
    ).length;

  const thisMonthLeads = createdIn(current);
  const serviceCountsThisMonth = new Map<LeadService, number>();
  for (const lead of thisMonthLeads) {
    for (const service of lead.services) {
      serviceCountsThisMonth.set(service, (serviceCountsThisMonth.get(service) ?? 0) + 1);
    }
  }
  // Ties go to the service listed first on the inquiry form.
  const topService = SERVICES.reduce<LeadStats["topService"]>((best, service) => {
    const count = serviceCountsThisMonth.get(service) ?? 0;
    return count > (best?.count ?? 0) ? { service, count } : best;
  }, null);

  const countryCounts = new Map<LeadCountry, number>();
  const serviceCounts = new Map<LeadService, number>();
  for (const lead of leads) {
    countryCounts.set(lead.country, (countryCounts.get(lead.country) ?? 0) + 1);
    for (const service of lead.services) serviceCounts.set(service, (serviceCounts.get(service) ?? 0) + 1);
  }

  const wonTotal = leads.filter((lead) => lead.status === "Won").length;

  return {
    monthName: monthLabel(current, "name"),
    previousMonthName: monthLabel(previous, "name"),
    thisMonth: thisMonthLeads.length,
    lastMonth: createdIn(previous).length,
    wonThisMonth: wonIn(current),
    wonLastMonth: wonIn(previous),
    conversionRate: leads.length ? wonTotal / leads.length : 0,
    wonTotal,
    total: leads.length,
    topService,
    perMonth: Array.from({ length: months }, (_, index) => {
      const key = shiftMonth(current, index - (months - 1));
      return {
        key,
        month: monthLabel(key, "short"),
        label: monthLabel(key, "full"),
        leads: createdIn(key).length,
        current: key === current,
      };
    }),
    byCountry: breakdown(COUNTRIES, countryCounts, leads.length),
    // A lead can ask for several services, so shares are of leads, not of all selections.
    byService: breakdown(SERVICES, serviceCounts, leads.length),
  };
}
