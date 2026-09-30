import type { LeadStatus } from "@/lib/leads/types";

// Each status has its own colour and a dot, and the label is always shown, so status is
// never conveyed by colour alone.
export const STATUS_STYLES: Record<LeadStatus, { badge: string; dot: string }> = {
  New: {
    badge: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
    dot: "bg-sky-600 dark:bg-sky-400",
  },
  Contacted: {
    badge: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
    dot: "bg-violet-600 dark:bg-violet-400",
  },
  "Proposal sent": {
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    dot: "bg-amber-600 dark:bg-amber-400",
  },
  Won: {
    badge: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
  Lost: {
    badge: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    dot: "bg-zinc-500 dark:bg-zinc-400",
  },
};

export default function StatusBadge({ status }: { status: LeadStatus }) {
  const styles = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${styles.badge}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${styles.dot}`} />
      {status}
    </span>
  );
}
