import type { Metadata } from "next";
import AccessDenied from "@/components/admin/AccessDenied";
import { requireRole } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import LeadDetail from "@/components/admin/leads/LeadDetail";
import { loadLead } from "@/lib/leads/server";

export async function generateMetadata({ params }: PageProps<"/admin/leads/[id]">): Promise<Metadata> {
  if (!(await requireRole("admin"))) return { title: "Access denied" };
  const lead = await loadLead((await params).id);
  return { title: lead ? lead.name : "Lead not found" };
}

export default async function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  // Checked before any data is loaded, so nothing confidential reaches an editor.
  if (!(await requireRole("admin"))) return <AccessDenied />;
  const { id } = await params;
  if (!(await loadLead(id))) notFound();

  return <LeadDetail id={id} />;
}
