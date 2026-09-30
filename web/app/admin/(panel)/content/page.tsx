import type { Metadata } from "next";
import ContentHub from "@/components/admin/content/ContentHub";

export const metadata: Metadata = { title: "Content" };

export default function ContentPage() {
  return <ContentHub />;
}
