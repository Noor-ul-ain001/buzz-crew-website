"use client";

import { useState } from "react";
import AdminTable from "@/components/admin/content/AdminTable";
import { useToast } from "@/components/ui/Toast";
import { apiRequest } from "@/lib/api/request";
import { downloadFile } from "@/lib/download";
import { formatDate } from "@/lib/format";

export type Subscriber = { id: string; email: string; sourcePage: string; createdAt: string };

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

// Newsletter sign-ups from the database: export them for the mailing tool, or remove
// someone who asked to be taken off the list.
export default function SubscribersTable({ initial }: { initial: Subscriber[] }) {
  const [subscribers, setSubscribers] = useState(initial);
  const [removing, setRemoving] = useState<string | null>(null);
  const toast = useToast();

  async function remove(subscriber: Subscriber) {
    setRemoving(subscriber.id);
    const result = await apiRequest("DELETE", `/api/v1/admin/subscribers/${subscriber.id}`);
    setRemoving(null);
    if (!result.ok) {
      toast("Couldn't remove that subscriber. Please try again.", "error");
      return;
    }
    setSubscribers((current) => current.filter((item) => item.id !== subscriber.id));
    toast(`Removed ${subscriber.email}.`);
  }

  function exportCsv() {
    const rows = [["Email", "Signed up on page", "Signed up"], ...subscribers.map((s) => [s.email, s.sourcePage, s.createdAt])];
    downloadFile("newsletter-subscribers.csv", [rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], "text/csv");
  }

  return (
    <>
      <div className="mt-6 mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="rounded-2xl border border-border px-5 py-3">
          <span className="text-2xl font-bold tabular-nums">{subscribers.length}</span>{" "}
          <span className="text-muted">{subscribers.length === 1 ? "subscriber" : "subscribers"}</span>
        </p>
        {subscribers.length > 0 && (
          <button
            type="button"
            onClick={exportCsv}
            className="press rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-foreground"
          >
            Export CSV
          </button>
        )}
      </div>
      <AdminTable
        caption="Newsletter subscribers"
        rows={subscribers}
        titleHeader="Email"
        title={(subscriber) => subscriber.email}
        empty="No one has signed up yet. The form is in the site footer."
        columns={[
          { header: "Signed up on", cell: (subscriber) => subscriber.sourcePage, className: "text-muted" },
          { header: "Date", cell: (subscriber) => formatDate(subscriber.createdAt), className: "whitespace-nowrap text-muted" },
          {
            header: "Actions",
            cell: (subscriber) => (
              <button
                type="button"
                onClick={() => void remove(subscriber)}
                disabled={removing === subscriber.id}
                className="text-sm font-medium text-danger underline-offset-4 hover:underline disabled:opacity-60"
              >
                {removing === subscriber.id ? "Removing…" : "Remove"}
                <span className="sr-only"> {subscriber.email}</span>
              </button>
            ),
          },
        ]}
      />
    </>
  );
}
