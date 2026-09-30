import type { Metadata } from "next";
import TeamMemberForm from "@/components/admin/content/TeamMemberForm";

export const metadata: Metadata = { title: "New team member" };

export default function NewTeamMemberPage() {
  return <TeamMemberForm />;
}
