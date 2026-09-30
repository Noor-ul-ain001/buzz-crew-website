import type { Metadata } from "next";
import CaseStudyEditor from "@/components/admin/case-studies/CaseStudyEditor";
import { loadTestimonialOptions } from "@/lib/content/case-study-server";

export const metadata: Metadata = { title: "New case study" };

export default async function NewCaseStudyPage() {
  return <CaseStudyEditor initial={null} testimonials={await loadTestimonialOptions()} />;
}
