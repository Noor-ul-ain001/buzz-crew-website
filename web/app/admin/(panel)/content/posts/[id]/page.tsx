import type { Metadata } from "next";
import PostEditor from "@/components/admin/content/PostEditor";

export const metadata: Metadata = { title: "Edit post" };

// The content layout loads every post from the API; PostEditor shows the not-found state itself.
export default async function EditPostPage({ params }: PageProps<"/admin/content/posts/[id]">) {
  const { id } = await params;
  return <PostEditor id={id} />;
}
