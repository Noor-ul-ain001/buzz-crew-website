import type { Metadata } from "next";
import AccessDenied from "@/components/admin/AccessDenied";
import SubscribersTable from "@/components/admin/SubscribersTable";
import { requireRole, serverApi } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Subscribers" };

export default async function SubscribersPage() {
  // Checked before any data is loaded, so nothing confidential reaches an editor.
  if (!(await requireRole("admin"))) return <AccessDenied />;
  const api = await serverApi();
  const { data } = await api.GET("/api/v1/admin/subscribers", { cache: "no-store" });
  const subscribers = (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    sourcePage: row.source_page,
    createdAt: row.created_at,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-3xl font-bold tracking-tight">Newsletter subscribers</h1>
      <p className="mt-1 text-muted">Everyone who signed up through the form in the site footer, newest first.</p>
      <SubscribersTable initial={subscribers} />
    </main>
  );
}
