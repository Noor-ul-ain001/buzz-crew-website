import type { Metadata } from "next";
import FaqForm from "@/components/admin/content/FaqForm";

export const metadata: Metadata = { title: "Edit FAQ" };

// The content layout loads every FAQ from the API; FaqForm shows the not-found state itself.
export default async function EditFaqPage({ params }: PageProps<"/admin/content/faqs/[id]">) {
  const { id } = await params;
  return <FaqForm id={id} />;
}
