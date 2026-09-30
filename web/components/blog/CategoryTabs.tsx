import Link from "next/link";
import { BLOG_CATEGORIES } from "@/lib/content/types";

// Category "tabs" are links (each category has its own URL), styled as a tab strip.
// On narrow screens the strip scrolls sideways.
export default function CategoryTabs({ active }: { active: string | null }) {
  const tabs: { slug: string | null; name: string; href: string }[] = [
    { slug: null, name: "All posts", href: "/blog" },
    ...BLOG_CATEGORIES.map((category) => ({
      slug: category.slug,
      name: category.name,
      href: `/blog/category/${category.slug}`,
    })),
  ];

  return (
    <nav aria-label="Blog categories" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 border-b border-border sm:w-auto">
        {tabs.map((tab) => {
          const current = tab.slug === active;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={current ? "page" : undefined}
                className="-mb-px block border-b-2 border-transparent px-3 py-3 text-sm font-medium whitespace-nowrap text-muted hover:text-foreground aria-[current=page]:border-foreground aria-[current=page]:text-foreground"
              >
                {tab.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
