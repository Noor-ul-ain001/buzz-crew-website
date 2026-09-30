import type { Metadata } from "next";
import TeamMemberForm from "@/components/admin/content/TeamMemberForm";

export const metadata: Metadata = { title: "Edit team member" };

// Not checked on the server: items created this session exist only in the admin's browser
// (mock data), so TeamMemberForm shows the not-found state itself.
export default async function EditTeamMemberPage({ params }: PageProps<"/admin/content/team/[id]">) {
  const { id } = await params;
  return <TeamMemberForm id={id} />;
}
