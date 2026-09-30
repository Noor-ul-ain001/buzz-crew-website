"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useInquiry, type OpenInquiryOptions } from "@/components/inquiry/InquiryModalProvider";

const DEFAULT_CLASS =
  "rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-foreground hover:brightness-95";

// Every "Start a project" call to action on the site should use this component. It opens
// the shared inquiry modal and never an email client (FR-001).
export default function StartProjectButton({
  className = DEFAULT_CLASS,
  children = "Start a project",
  services,
  message,
}: {
  className?: string;
  children?: ReactNode;
} & OpenInquiryOptions) {
  const inquiry = useInquiry();
  // Every call to action gets the same small press feedback (see .press in globals.css).
  const classes = `press ${className}`;

  // Outside the site layout (no provider), fall back to the contact page.
  if (!inquiry) {
    return (
      <Link href="/contact" className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => inquiry.openInquiry({ services, message })}
      className={classes}
    >
      {children}
    </button>
  );
}
