import type { Schemas } from "@/lib/api/client";

type Metric = Schemas["Metric"];

// Results first: big number, what was measured, and over what period (005 T012).
export default function ResultStats({ metrics, size = "large" }: { metrics: Metric[]; size?: "large" | "small" }) {
  if (metrics.length === 0) return null;
  return (
    <dl className={`grid gap-3 ${size === "large" ? "grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 min-[360px]:grid-cols-3"}`}>
      {metrics.map((metric) => (
        <div key={`${metric.value}-${metric.label}`} className="flex min-w-0 flex-col-reverse gap-1 rounded-2xl border border-border bg-surface p-4">
          <dt className="text-sm text-muted">
            <span className="font-medium text-foreground">{metric.label}</span> {metric.period}
            {metric.starting_value && <span className="block text-xs">from {metric.starting_value}</span>}
          </dt>
          <dd className={`font-display leading-none break-words text-accent-strong ${size === "large" ? "text-4xl sm:text-5xl" : "text-2xl"}`}>
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
