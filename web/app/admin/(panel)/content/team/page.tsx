import type { Metadata } from "next";
import ContentList from "@/components/admin/content/ContentList";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return <ContentList kind="team" />;
}
