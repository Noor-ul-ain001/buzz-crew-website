"use client";

import { useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import NavLinks from "@/components/nav/NavLinks";
import { useInquiry } from "@/components/inquiry/InquiryModalProvider";
import { CONTACT_EMAIL } from "@/lib/site";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);
  const inquiry = useInquiry();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface"
      >
        <span className="sr-only">Open menu</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <Modal open={open} onClose={close} title="Menu" returnFocusRef={triggerRef} variant="drawer">
        <nav aria-label="Mobile">
          <NavLinks
            onNavigate={close}
            className="flex flex-col"
            linkClassName="block border-b border-border py-4 text-xl font-semibold hover:text-muted aria-[current=page]:underline aria-[current=page]:decoration-accent aria-[current=page]:decoration-4 aria-[current=page]:underline-offset-8"
          />
        </nav>
        {inquiry && (
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => {
              // Close the menu first so only one dialog is ever open.
              close();
              inquiry.openInquiry();
            }}
            className="press mt-8 w-full rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground hover:brightness-95"
          >
            Start a project
          </button>
        )}
        <p className="mt-8 text-sm break-words text-muted">
          Prefer email?{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </Modal>
    </>
  );
}
