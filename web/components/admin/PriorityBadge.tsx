"use client";

import Tooltip from "@/components/ui/Tooltip";
import type { LeadScore, Priority } from "@/lib/leads/scoring";

const STYLES: Record<Priority, string> = {
  Hot: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  Warm: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  Cold: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

const ICONS: Record<Priority, string> = { Hot: "▲", Warm: "●", Cold: "▼" };

// A focusable badge whose tooltip gives the reason. "static" shows the reason as text
// instead, for places where a tooltip can't be used (inside a link, e.g. mobile cards).
export default function PriorityBadge({ score, variant = "tooltip" }: { score: LeadScore; variant?: "tooltip" | "static" }) {
  const badge = (
    <>
      <span aria-hidden="true" className="text-[0.6rem]">
        {ICONS[score.priority]}
      </span>
      {score.priority}
    </>
  );
  const badgeClass = `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STYLES[score.priority]}`;

  if (variant === "static") {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={badgeClass}>
          {badge}
          <span className="sr-only"> priority</span>
        </span>
        <span className="text-xs text-muted">
          <span className="font-semibold">Why:</span> {score.reason}
        </span>
      </span>
    );
  }

  return (
    // z-10 lifts it above the table row's full-row link so it can be hovered and focused.
    <Tooltip content={`Why: ${score.reason}`} className="z-10">
      {(describedBy) => (
        <button type="button" aria-describedby={describedBy} className={`${badgeClass} cursor-help`}>
          {badge}
          <span className="sr-only"> priority</span>
        </button>
      )}
    </Tooltip>
  );
}
