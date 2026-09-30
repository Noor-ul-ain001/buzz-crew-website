"use client";

import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";
import type { LeadStats } from "@/lib/leads/stats";

type Month = LeadStats["perMonth"][number];

// Colours come from the site's CSS tokens, so the chart follows light and dark mode.
export default function LeadsPerMonthChart({ data }: { data: Month[] }) {
  return (
    <figure className="mt-4">
      <div aria-hidden="true">
        <BarChart
          responsive
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          style={{ width: "100%", height: 280 }}
          accessibilityLayer={false}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "var(--surface)" }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
            formatter={(value) => [value, "Leads"]}
            contentStyle={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--foreground)",
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar dataKey="leads" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((month) => (
              <Cell
                key={month.key}
                fill={month.current ? "var(--accent)" : "var(--foreground)"}
                stroke={month.current ? "var(--foreground)" : "none"}
                strokeWidth={month.current ? 1.5 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </div>

      {/* The chart is visual only; the same numbers are available as a table. */}
      <figcaption className="mt-3">
        <details>
          <summary className="cursor-pointer text-sm font-medium text-muted hover:text-foreground">
            Show as a table
          </summary>
          <table className="mt-3 w-full max-w-sm text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-1.5 font-semibold">Month</th>
                <th scope="col" className="py-1.5 text-right font-semibold">Leads</th>
              </tr>
            </thead>
            <tbody>
              {data.map((month) => (
                <tr key={month.key} className="border-b border-border last:border-0">
                  <th scope="row" className="py-1.5 font-normal">
                    {month.label}
                    {month.current && " (so far)"}
                  </th>
                  <td className="py-1.5 text-right tabular-nums">{month.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figcaption>
    </figure>
  );
}
