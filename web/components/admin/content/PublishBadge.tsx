import type { PublishStatus } from "@/lib/content/types";

const STYLES: Record<PublishStatus, { badge: string; dot: string }> = {
  Draft: {
    badge: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    dot: "bg-zinc-500 dark:bg-zinc-400",
  },
  Published: {
    badge: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
};

export default function PublishBadge({ status }: { status: PublishStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STYLES[status].badge}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${STYLES[status].dot}`} />
      {status}
    </span>
  );
}
