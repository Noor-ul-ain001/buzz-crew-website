import type { Metadata } from "next";
import TeamMemberForm from "@/components/admin/content/TeamMemberForm";

export const metadata: Metadata = { title: "Edit team member" };

// The content layout loads every item from the API; TeamMemberForm shows the not-found state itself.
export default async function EditTeamMemberPage({ params }: PageProps<"/admin/content/team/[id]">) {
  const { id } = await params;
  return <TeamMemberForm id={id} />;
}
