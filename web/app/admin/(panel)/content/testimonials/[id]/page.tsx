import type { Metadata } from "next";
import TestimonialForm from "@/components/admin/content/TestimonialForm";

export const metadata: Metadata = { title: "Edit testimonial" };

// The content layout loads every item from the API; TestimonialForm shows the not-found state itself.
export default async function EditTestimonialPage({ params }: PageProps<"/admin/content/testimonials/[id]">) {
  const { id } = await params;
  return <TestimonialForm id={id} />;
}
