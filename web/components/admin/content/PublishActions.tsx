"use client";

import Tooltip from "@/components/ui/Tooltip";
import type { PublishStatus } from "@/lib/content/types";

export type PublishAction = "draft" | "publish" | "unpublish";

const secondaryClass =
  "rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface disabled:opacity-60";

// Drafts: Save draft / Publish. Published items: Unpublish / Publish changes.
// Publish stays focusable when blocked (aria-disabled, not disabled) so keyboard and
// screen reader users can reach the tooltip that explains why.
export default function PublishActions({
  status,
  pending,
  publishBlocker,
  onAction,
}: {
  /** The saved status, or null for an item that hasn't been saved yet. */
  status: PublishStatus | null;
  pending: PublishAction | null;
  publishBlocker: string | null;
  onAction: (action: PublishAction) => void;
}) {
  const busy = pending !== null;
  const published = status === "Published";

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
      {published ? (
        <button type="button" onClick={() => onAction("unpublish")} disabled={busy} className={secondaryClass}>
          {pending === "unpublish" ? "Unpublishing…" : "Unpublish"}
        </button>
      ) : (
        <button type="button" onClick={() => onAction("draft")} disabled={busy} className={secondaryClass}>
          {pending === "draft" ? "Saving…" : "Save draft"}
        </button>
      )}
      <Tooltip content={publishBlocker} align="end" className="w-full sm:w-auto">
        {(describedBy) => (
          <button
            type="button"
            onClick={() => {
              if (!publishBlocker && !busy) onAction("publish");
            }}
            aria-disabled={publishBlocker || busy ? true : undefined}
            aria-describedby={describedBy}
            className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:brightness-95 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:brightness-100 sm:w-auto"
          >
            {pending === "publish" ? "Publishing…" : published ? "Publish changes" : "Publish"}
          </button>
        )}
      </Tooltip>
    </div>
  );
}
