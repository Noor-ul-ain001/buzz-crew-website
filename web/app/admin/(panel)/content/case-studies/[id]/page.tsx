import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseStudyEditor from "@/components/admin/case-studies/CaseStudyEditor";
import { loadCaseStudy, loadTestimonialOptions } from "@/lib/content/case-study-server";

export const metadata: Metadata = { title: "Edit case study" };

export default async function EditCaseStudyPage({ params }: PageProps<"/admin/content/case-studies/[id]">) {
  const { id } = await params;
  const [item, testimonials] = await Promise.all([loadCaseStudy(id), loadTestimonialOptions()]);
  if (!item) notFound();
  return <CaseStudyEditor key={item.id} initial={item} testimonials={testimonials} />;
}
