"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import { useLeads } from "@/components/admin/LeadsProvider";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Lead } from "@/lib/leads/types";

export default function DeleteLeadButton({
  lead,
  onDeleting,
}: {
  lead: Lead;
  onDeleting: (deleting: boolean) => void;
}) {
  const router = useRouter();
  const { removeLead } = useLeads();
  const toast = useToast();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const fieldId = useId();
  const hintId = useId();
  const errorId = useId();

  const matches = typed.trim().toLowerCase() === lead.email.toLowerCase();

  function close() {
    if (deleting) return;
    setOpen(false);
    setTyped("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!matches) {
      setError("The email doesn't match. Check it and try again.");
      return;
    }
    setError("");
    setDeleting(true);
    onDeleting(true);
    try {
      await removeLead(lead.id);
      toast(`${lead.name} was deleted.`);
      router.push("/admin/leads");
    } catch {
      onDeleting(false);
      setDeleting(false);
      setError("Couldn't delete this lead. Please try again.");
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-full border border-danger px-4 py-2 text-sm font-semibold text-danger hover:bg-danger hover:text-background"
      >
        Delete permanently
      </button>
      <Modal
        open={open}
        onClose={close}
        title="Delete this lead?"
        description={`${lead.name}, their message, notes and activity will be removed permanently. This can't be undone.`}
        returnFocusRef={triggerRef}
      >
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor={fieldId} className="text-sm font-semibold">
            Type <span className="rounded bg-surface px-1.5 py-0.5 font-mono">{lead.email}</span> to confirm
          </label>
          <input
            id={fieldId}
            type="text"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${hintId} ${errorId}` : hintId}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm focus:border-foreground focus:outline-none aria-invalid:border-danger"
          />
          <p id={hintId} className="mt-1 text-xs text-muted">
            This makes sure the right lead is deleted.
          </p>
          {error && (
            <p id={errorId} role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={close}
              disabled={deleting}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!matches || deleting}
              className="rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
