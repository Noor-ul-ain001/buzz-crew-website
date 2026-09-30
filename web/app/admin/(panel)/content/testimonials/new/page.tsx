import type { Metadata } from "next";
import TestimonialForm from "@/components/admin/content/TestimonialForm";

export const metadata: Metadata = { title: "New testimonial" };

export default function NewTestimonialPage() {
  return <TestimonialForm />;
}
