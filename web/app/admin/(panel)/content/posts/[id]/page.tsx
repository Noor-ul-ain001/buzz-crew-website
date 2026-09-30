import type { Metadata } from "next";
import PostEditor from "@/components/admin/content/PostEditor";

export const metadata: Metadata = { title: "Edit post" };

// Not checked on the server: posts created this session exist only in the admin's browser
// (mock data), so PostEditor shows the not-found state itself.
export default async function EditPostPage({ params }: PageProps<"/admin/content/posts/[id]">) {
  const { id } = await params;
  return <PostEditor id={id} />;
}
