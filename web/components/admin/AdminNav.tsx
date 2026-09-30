"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth/types";

// Hiding links is a convenience; the pages and the API refuse editors regardless (003 T024).
const LINKS: { label: string; href: string; adminOnly: boolean }[] = [
  { label: "Overview", href: "/admin", adminOnly: false },
  { label: "Leads", href: "/admin/leads", adminOnly: true },
  { label: "Content", href: "/admin/content", adminOnly: false },
  { label: "Subscribers", href: "/admin/subscribers", adminOnly: true },
  { label: "Team", href: "/admin/users", adminOnly: true },
];

export default function AdminNav({
  role,
  className,
  linkClassName,
}: {
  role: Role;
  className?: string;
  linkClassName?: string;
}) {
  const pathname = usePathname();

  return (
    <ul className={className}>
      {LINKS.filter((link) => role === "admin" || !link.adminOnly).map((link) => {
        // "/admin" is only current on the overview itself, not on every admin page.
        const current =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <Link href={link.href} aria-current={current ? "page" : undefined} className={linkClassName}>
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
