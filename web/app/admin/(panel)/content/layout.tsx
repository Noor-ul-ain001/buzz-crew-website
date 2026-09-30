import { ContentProvider } from "@/components/admin/content/ContentProvider";
import { loadClientLogos, loadFaqs, loadPosts, loadTeamMembers, loadTestimonials } from "@/lib/content/admin-server";

// Loads every content collection once for the content screens, from the API (drafts included).
export default async function ContentLayout({ children }: LayoutProps<"/admin/content">) {
  const [testimonials, logos, team, posts, faqs] = await Promise.all([
    loadTestimonials(),
    loadClientLogos(),
    loadTeamMembers(),
    loadPosts(),
    loadFaqs(),
  ]);

  return <ContentProvider initial={{ testimonials, logos, team, posts, faqs }}>{children}</ContentProvider>;
}
