"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import type { Schemas } from "@/lib/api/client";

export type ActivitySummary = Schemas["ActivitySummary"];
type Day = ActivitySummary["days"][number];
type Metric = "inquiries" | "subscribers" | "content" | "lead_updates";

// One small chart per kind of activity rather than one chart with four colours: the counts
// differ in scale, and each chart can stay single-colour (the brand gold) with its own title.
const METRICS: { key: Metric; title: string; noun: [string, string]; href: string }[] = [
  { key: "inquiries", title: "New inquiries", noun: ["inquiry", "inquiries"], href: "/admin/leads" },
  { key: "lead_updates", title: "Lead follow-up", noun: ["update", "updates"], href: "/admin/leads" },
  { key: "subscribers", title: "Newsletter sign-ups", noun: ["sign-up", "sign-ups"], href: "/admin/subscribers" },
  { key: "content", title: "Content changes", noun: ["change", "changes"], href: "/admin/content" },
];

const STATUS_LABELS: Record<Schemas["LeadStatus"], string> = {
  new: "New",
  contacted: "Contacted",
  proposal_sent: "Proposal sent",
  won: "Won",
  lost: "Lost",
};

const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const feedTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const label = (day: Day) => dayLabel.format(new Date(`${day.date}T00:00:00Z`));
const plural = (count: number, [one, many]: [string, string]) => `${count} ${count === 1 ? one : many}`;

function MiniChart({ days, metric }: { days: Day[]; metric: (typeof METRICS)[number] }) {
  const data = days.map((day) => ({ label: label(day), value: day[metric.key] }));
  const total = data.reduce((sum, day) => sum + day.value, 0);

  return (
    <li className="rounded-2xl border border-border p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold">
          <Link href={metric.href} className="hover:underline hover:underline-offset-4">
            {metric.title}
          </Link>
        </h3>
        <p className="text-sm text-muted">30 days</p>
      </div>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{total}</p>
      <div aria-hidden="true" className="mt-3">
        <BarChart
          responsive
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          style={{ width: "100%", height: 120 }}
          accessibilityLayer={false}
          barCategoryGap={2}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={40} tick={{ fill: "var(--muted)", fontSize: 11 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} tick={{ fill: "var(--muted)", fontSize: 11 }} />
          <Tooltip
            cursor={{ fill: "var(--surface)" }}
            formatter={(value) => [plural(Number(value), metric.noun), ""]}
            separator=""
            contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={14} />
        </BarChart>
      </div>
    </li>
  );
}

export function ActivityCharts({ summary }: { summary: ActivitySummary }) {
  return (
    <section aria-labelledby="activity-heading" className="mt-6">
      <h2 id="activity-heading" className="text-lg font-semibold tracking-tight">
        Activity
      </h2>
      <p className="text-sm text-muted">Everything that happened on the site and in the admin, per day, over the last 30 days.</p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric) => (
          <MiniChart key={metric.key} days={summary.days} metric={metric} />
        ))}
      </ul>
      {/* The charts are visual only; the same numbers are available as a table. */}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium text-muted hover:text-foreground">Show activity as a table</summary>
        <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">Day</th>
                {METRICS.map((metric) => (
                  <th key={metric.key} scope="col" className="px-3 py-2 text-right font-semibold">
                    {metric.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...summary.days].reverse().map((day) => (
                <tr key={day.date} className="border-t border-border">
                  <th scope="row" className="px-3 py-1.5 font-normal">{label(day)}</th>
                  {METRICS.map((metric) => (
                    <td key={metric.key} className="px-3 py-1.5 text-right tabular-nums">
                      {day[metric.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function PipelineCard({ pipeline }: { pipeline: ActivitySummary["pipeline"] }) {
  const max = Math.max(1, ...pipeline.map((stage) => stage.count));
  const total = pipeline.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <section aria-labelledby="pipeline-heading" className="rounded-2xl border border-border p-5 sm:p-6">
      <h2 id="pipeline-heading" className="text-lg font-semibold tracking-tight">
        Lead pipeline
      </h2>
      <p className="text-sm text-muted">Where all {total} leads stand now.</p>
      <ul className="mt-5 flex flex-col gap-4">
        {pipeline.map((stage) => (
          <li key={stage.status}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <Link href={`/admin/leads?status=${encodeURIComponent(STATUS_LABELS[stage.status])}`} className="font-medium hover:underline hover:underline-offset-4">
                {STATUS_LABELS[stage.status]}
              </Link>
              <span className="font-semibold tabular-nums">{stage.count}</span>
            </div>
            <div aria-hidden="true" className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(stage.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const KIND_LABELS: Record<ActivitySummary["recent"][number]["kind"], string> = {
  inquiry: "Inquiry",
  lead_update: "Status",
  note: "Note",
  subscriber: "Newsletter",
  content: "Content",
};

export function RecentActivity({ items }: { items: ActivitySummary["recent"] }) {
  return (
    <section aria-labelledby="recent-heading" className="rounded-2xl border border-border p-5 sm:p-6">
      <h2 id="recent-heading" className="text-lg font-semibold tracking-tight">
        Recent activity
      </h2>
      <p className="text-sm text-muted">The latest {items.length} things that happened, newest first.</p>
      {items.length === 0 ? (
        <p className="mt-5 text-sm text-muted">Nothing yet. Inquiries, sign-ups and edits will appear here.</p>
      ) : (
        <ol className="mt-5 flex flex-col">
          {items.map((item, index) => (
            <li key={`${item.at}-${index}`} className="flex gap-3 border-t border-border py-3 first:border-t-0 first:pt-0">
              <span className="mt-0.5 w-20 shrink-0 text-xs font-semibold tracking-wide text-accent-strong uppercase">{KIND_LABELS[item.kind]}</span>
              <div className="min-w-0 flex-1">
                {item.lead_id ? (
                  <Link href={`/admin/leads/${item.lead_id}`} className="text-sm font-medium hover:underline hover:underline-offset-4">
                    {item.text}
                  </Link>
                ) : (
                  <p className="text-sm font-medium">{item.text}</p>
                )}
                <p className="text-xs text-muted">
                  <time dateTime={item.at}>{feedTime.format(new Date(item.at))}</time>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
