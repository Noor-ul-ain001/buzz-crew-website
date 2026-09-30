import type { Metadata } from "next";
import { FaqsTable } from "@/components/admin/content/ContentTables";

export const metadata: Metadata = { title: "FAQs" };

export default function FaqsPage() {
  return <FaqsTable />;
}
