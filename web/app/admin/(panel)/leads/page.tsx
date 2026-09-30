import type { Metadata } from "next";
import AccessDenied from "@/components/admin/AccessDenied";
import { requireRole } from "@/lib/auth/session";
import LeadsTable from "@/components/admin/leads/LeadsTable";
import { parseLeadFilters } from "@/lib/leads/filters";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  // Checked before any data is loaded, so nothing confidential reaches an editor.
  if (!(await requireRole("admin"))) return <AccessDenied />;
  const filters = parseLeadFilters(await searchParams);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
      <p className="mt-1 text-muted">Every inquiry from the website, newest first.</p>
      <LeadsTable filters={filters} />
    </main>
  );
}
