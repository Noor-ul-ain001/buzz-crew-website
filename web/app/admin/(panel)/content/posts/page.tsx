import type { Metadata } from "next";
import { PostsTable } from "@/components/admin/content/ContentTables";

export const metadata: Metadata = { title: "Blog posts" };

export default function PostsPage() {
  return <PostsTable />;
}
