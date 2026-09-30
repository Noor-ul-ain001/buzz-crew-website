import type { Metadata } from "next";
import FaqForm from "@/components/admin/content/FaqForm";

export const metadata: Metadata = { title: "New FAQ" };

export default function NewFaqPage() {
  return <FaqForm />;
}
