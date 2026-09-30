import type { Metadata } from "next";
import ContentList from "@/components/admin/content/ContentList";

export const metadata: Metadata = { title: "Testimonials" };

export default function TestimonialsPage() {
  return <ContentList kind="testimonials" />;
}
