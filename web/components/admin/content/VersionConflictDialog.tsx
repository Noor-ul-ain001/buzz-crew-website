"use client";

import { useRef } from "react";
import Modal from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/format";

/** Shown when someone else saved the item while this admin was editing it (004 T015). */
export default function VersionConflictDialog({
  conflict,
  onReview,
  onOverwrite,
  onClose,
}: {
  conflict: { changedBy: string; current: { updatedAt: string } } | null;
  onReview: () => void;
  onOverwrite: () => void;
  onClose: () => void;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Modal
      open={conflict !== null}
      onClose={onClose}
      title="This was changed while you were editing"
      description={
        conflict
          ? `Changed by ${conflict.changedBy} at ${formatDateTime(conflict.current.updatedAt)}.`
          : undefined
      }
      returnFocusRef={returnFocus}
    >
      <p className="text-sm text-muted">
        Review their version (your unsaved edits will be replaced), or overwrite it with yours.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onOverwrite}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface"
        >
          Overwrite with mine
        </button>
        <button
          type="button"
          onClick={onReview}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
        >
          Review their changes
        </button>
      </div>
    </Modal>
  );
}
