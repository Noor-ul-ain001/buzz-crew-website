import type { Metadata } from "next";
import AccessDenied from "@/components/admin/AccessDenied";
import { requireRole } from "@/lib/auth/session";
import AdminTable from "@/components/admin/content/AdminTable";
import { SUBSCRIBER_STATUSES, getSubscribers } from "@/lib/data/newsletter";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Subscribers" };

const STATUS_STYLES = {
  Pending: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  Confirmed: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  Unsubscribed: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
} as const;

export default async function SubscribersPage() {
  // Checked before any data is loaded, so nothing confidential reaches an editor.
  if (!(await requireRole("admin"))) return <AccessDenied />;
  const subscribers = (await getSubscribers()).sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-3xl font-bold tracking-tight">Newsletter subscribers</h1>
      <p className="mt-1 text-muted">Sign-ups are double opt-in: people stay Pending until they confirm from their inbox.</p>
      <ul className="mt-6 mb-8 grid gap-3 sm:grid-cols-3">
        {SUBSCRIBER_STATUSES.map((status) => (
          <li key={status} className="rounded-2xl border border-border p-4">
            <p className="text-sm text-muted">{status}</p>
            <p className="text-2xl font-bold">{subscribers.filter((subscriber) => subscriber.status === status).length}</p>
          </li>
        ))}
      </ul>
      <AdminTable
        caption="Newsletter subscribers"
        rows={subscribers}
        titleHeader="Email"
        title={(subscriber) => subscriber.email}
        columns={[
          {
            header: "Status",
            cell: (subscriber) => (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[subscriber.status]}`}>
                {subscriber.status}
              </span>
            ),
          },
          { header: "Source", cell: (subscriber) => subscriber.source },
          {
            header: "Signed up",
            cell: (subscriber) => formatDate(subscriber.subscribedAt),
            className: "whitespace-nowrap text-muted",
          },
        ]}
      />
    </main>
  );
}
