import type { Metadata } from "next";
import CaseStudyList from "@/components/admin/case-studies/CaseStudyList";
import { loadCaseStudies } from "@/lib/content/case-study-server";

export const metadata: Metadata = { title: "Case studies" };

export default async function CaseStudiesPage() {
  return <CaseStudyList initial={await loadCaseStudies()} />;
}
