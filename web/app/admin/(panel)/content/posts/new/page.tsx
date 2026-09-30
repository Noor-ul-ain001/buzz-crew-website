import type { Metadata } from "next";
import PostEditor from "@/components/admin/content/PostEditor";

export const metadata: Metadata = { title: "New post" };

export default function NewPostPage() {
  return <PostEditor />;
}
