import type { Metadata } from "next";
import AccessDenied from "@/components/admin/AccessDenied";
import TeamManager from "@/components/admin/users/TeamManager";
import { requireRole, serverApi } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Team" };

export default async function UsersPage() {
  const me = await requireRole("admin");
  if (!me) return <AccessDenied />;

  const api = await serverApi();
  const { data: users } = await api.GET("/api/v1/users", { cache: "no-store" });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-3xl font-bold tracking-tight">Team</h1>
      <p className="mt-1 text-muted">
        Admins see everything. Editors manage website content only and never see leads, applicants or subscribers.
      </p>
      <TeamManager users={users ?? []} currentUserId={me.id} />
    </main>
  );
}
