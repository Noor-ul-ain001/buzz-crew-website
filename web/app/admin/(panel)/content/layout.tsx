import { ContentProvider } from "@/components/admin/content/ContentProvider";
import { loadClientLogos, loadTeamMembers, loadTestimonials } from "@/lib/content/admin-server";
import { getContent } from "@/lib/data/content";

// Loads every content collection once for the content screens: testimonials, logos and
// team from the API (drafts included); posts and FAQs from mock data for now.
export default async function ContentLayout({ children }: LayoutProps<"/admin/content">) {
  const [testimonials, logos, team, posts, faqs] = await Promise.all([
    loadTestimonials(),
    loadClientLogos(),
    loadTeamMembers(),
    getContent("posts"),
    getContent("faqs"),
  ]);

  return <ContentProvider initial={{ testimonials, logos, team, posts, faqs }}>{children}</ContentProvider>;
}
