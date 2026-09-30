"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLeads } from "@/components/admin/LeadsProvider";
import { ActivityCharts, PipelineCard, RecentActivity, type ActivitySummary } from "@/components/admin/overview/ActivityCharts";
import LeadsPerMonthChart from "@/components/admin/overview/LeadsPerMonthChart";
import { computeLeadStats, type Breakdown } from "@/lib/leads/stats";

const percent = new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 0 });

function comparison(current: number, previous: number, previousMonth: string) {
  const difference = current - previous;
  if (difference === 0) return `Same as ${previousMonth}`;
  return `${difference > 0 ? "+" : "−"}${Math.abs(difference)} vs ${previousMonth}`;
}

export default function Overview({ activity }: { activity: ActivitySummary | null }) {
  const { leads, now } = useLeads();
  const stats = computeLeadStats(leads, now);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 text-muted">How the website is bringing in work, {stats.monthName} so far.</p>
        </div>
        <Link href="/admin/leads" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90">
          View all leads
        </Link>
      </div>

      <section aria-label="Key numbers" className="mt-8">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Leads this month"
            value={String(stats.thisMonth)}
            detail={comparison(stats.thisMonth, stats.lastMonth, stats.previousMonthName)}
          />
          <StatCard
            label="Conversion rate"
            value={percent.format(stats.conversionRate)}
            detail={`${stats.wonTotal} of ${stats.total} leads won, all time`}
          />
          <StatCard
            label="Won this month"
            value={String(stats.wonThisMonth)}
            detail={comparison(stats.wonThisMonth, stats.wonLastMonth, stats.previousMonthName)}
          />
          <StatCard
            label="Top service this month"
            value={stats.topService?.service ?? "None yet"}
            detail={
              stats.topService
                ? `Requested in ${stats.topService.count} of ${stats.thisMonth} leads`
                : "No leads this month"
            }
            highlight
          />
        </ul>
      </section>

      {activity && (
        <>
          <ActivityCharts summary={activity} />
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <PipelineCard pipeline={activity.pipeline} />
            <RecentActivity items={activity.recent} />
          </div>
        </>
      )}

      <section aria-labelledby="per-month-heading" className="mt-6 rounded-2xl border border-border p-5 sm:p-6">
        <h2 id="per-month-heading" className="text-lg font-semibold tracking-tight">
          Leads per month
        </h2>
        <p className="text-sm text-muted">Last 12 months. The current month is highlighted.</p>
        <LeadsPerMonthChart data={stats.perMonth} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <BreakdownCard
          id="by-country-heading"
          title="Leads by country"
          description={`All ${stats.total} leads.`}
          rows={stats.byCountry}
        />
        <BreakdownCard
          id="by-service-heading"
          title="Leads by service"
          description="Share of leads asking for each service. A lead can ask for more than one."
          rows={stats.byService}
        />
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
  highlight = false,
}: {
  label: string;
  value: string;
  detail: ReactNode;
  highlight?: boolean;
}) {
  return (
    <li className={`rounded-2xl border p-5 ${highlight ? "border-accent bg-accent/10" : "border-border"}`}>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </li>
  );
}

function BreakdownCard({
  id,
  title,
  description,
  rows,
}: {
  id: string;
  title: string;
  description: string;
  rows: Breakdown<string>;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <section aria-labelledby={id} className="rounded-2xl border border-border p-5 sm:p-6">
      <h2 id={id} className="text-lg font-semibold tracking-tight">
        {title}
      </h2>
      <p className="text-sm text-muted">{description}</p>
      <ul className="mt-5 flex flex-col gap-4">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{row.label}</span>
              <span className="text-muted tabular-nums">
                <span className="font-semibold text-foreground">{row.count}</span> · {percent.format(row.share)}
              </span>
            </div>
            <div aria-hidden="true" className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-foreground" style={{ width: `${(row.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
