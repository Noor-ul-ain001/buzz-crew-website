"use client";

import { useId, useState } from "react";
import { useLeads } from "@/components/admin/LeadsProvider";
import { useToast } from "@/components/ui/Toast";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/leads/types";

export default function StatusControl({ lead }: { lead: Lead }) {
  const { changeStatus } = useLeads();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const selectId = useId();

  async function handleChange(status: LeadStatus) {
    const previous = lead.status;
    setSaving(true);
    try {
      await changeStatus(lead.id, status);
      toast(`Status changed to ${status}.`);
    } catch {
      toast(`Couldn't change the status. It's back to ${previous}.`, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wide text-muted">
        Status
      </label>
      <div className="flex items-center gap-3">
        {/* Disabled while saving so two changes can't race each other's rollback. */}
        <select
          id={selectId}
          value={lead.status}
          disabled={saving}
          aria-describedby={saving ? `${selectId}-saving` : undefined}
          onChange={(event) => handleChange(event.target.value as LeadStatus)}
          className="min-w-44 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium focus:border-foreground focus:outline-none disabled:opacity-70"
        >
          {LEAD_STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        {saving && (
          <span id={`${selectId}-saving`} className="text-sm text-muted">
            Saving…
          </span>
        )}
      </div>
    </div>
  );
}
