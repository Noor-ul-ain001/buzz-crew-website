"use client";

import { useRef, useState } from "react";
import { useAdminUser } from "@/components/admin/AdminUserProvider";
import MarkdownEditor from "@/components/admin/content/MarkdownEditor";
import CopyButton from "@/components/ui/CopyButton";
import Modal from "@/components/ui/Modal";
import { tagSlug } from "@/lib/blog/utils";
import { downloadFile } from "@/lib/download";
import { generateProposalDraft } from "@/lib/leads/proposal";
import type { Lead } from "@/lib/leads/types";

// "Generate proposal draft": an editor with live preview, signed by the admin who made it.
// The draft isn't stored; copy or download it to send.
export default function ProposalDraft({ lead }: { lead: Lead }) {
  const { name } = useAdminUser();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [open, setOpen] = useState(false);

  async function generate() {
    setStatus("loading");
    try {
      setDraft(await generateProposalDraft(lead, name));
      setStatus("idle");
      setOpen(true);
    } catch {
      setStatus("error");
    }
  }

  const filename = `proposal-${tagSlug(lead.business || lead.name) || "draft"}.md`;

  return (
    <>
      <p className="mt-2 text-sm text-muted">
        {draft ? "A draft is ready. Changes you make are kept while you stay on this page." : "Start from a draft based on this lead's brief and our price list."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {draft && (
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
          >
            Open draft
          </button>
        )}
        <button
          ref={triggerRef}
          type="button"
          onClick={generate}
          disabled={status === "loading"}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-70 ${
            draft ? "border border-border hover:bg-surface" : "bg-foreground text-background hover:opacity-90"
          }`}
        >
          {status === "loading" && (
            <span aria-hidden="true" className="size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />
          )}
          {status === "loading" ? "Writing draft…" : draft ? "Regenerate" : "Generate proposal draft"}
        </button>
      </div>
      <p role="status" className="sr-only">
        {status === "loading" ? "Writing the proposal draft." : ""}
      </p>
      {status === "error" && (
        <p role="alert" className="mt-2 text-sm text-danger">
          Couldn&apos;t write a draft. Please try again.
        </p>
      )}

      <Modal
        open={open && draft !== null}
        onClose={() => setOpen(false)}
        title={`Proposal draft for ${lead.business || lead.name}`}
        returnFocusRef={triggerRef}
        variant="wide"
      >
        <div role="note" className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-accent bg-accent/10 px-4 py-3 text-sm">
          <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs font-bold text-accent-foreground">AI-generated</span>
          <strong>Draft only: review before sending.</strong>
          <span className="text-muted">Check the brief, prices and anything in [square brackets].</span>
        </div>
        {draft !== null && (
          <>
            <MarkdownEditor label="Proposal" value={draft} onChange={setDraft} required={false} />
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <CopyButton value={draft} label="proposal" />
              <button
                type="button"
                onClick={() => downloadFile(filename, [draft], "text/markdown;charset=utf-8")}
                className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:bg-surface"
              >
                Download .md
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
