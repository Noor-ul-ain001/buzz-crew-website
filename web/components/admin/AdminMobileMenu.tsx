"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import SignOutButton from "@/components/admin/SignOutButton";
import Modal from "@/components/ui/Modal";
import type { Role } from "@/lib/auth/types";

// Small screens: the admin navigation and account links live in a drawer behind one
// button, so the top bar stays a single tidy row even at ~210px wide.
export default function AdminMobileMenu({ name, role }: { name: string; role: Role }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="press inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:border-accent"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        Menu
      </button>
      <Modal open={open} onClose={close} title="Admin menu" returnFocusRef={triggerRef} variant="drawer">
        <nav aria-label="Admin">
          <AdminNav
            role={role}
            onNavigate={close}
            className="flex flex-col"
            linkClassName="block border-b border-border py-3.5 text-lg font-semibold hover:text-accent-strong aria-[current=page]:text-accent-strong"
          />
        </nav>
        <div className="mt-8 flex flex-col gap-3 text-sm">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {name}
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground capitalize">{role}</span>
          </p>
          <Link href="/" onClick={close} className="text-muted hover:text-foreground">
            View public site
          </Link>
          <div>
            <SignOutButton />
          </div>
        </div>
      </Modal>
    </>
  );
}
