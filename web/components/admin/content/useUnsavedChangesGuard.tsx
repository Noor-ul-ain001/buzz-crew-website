"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";

/**
 * Warns before unsaved edits are lost (004 T015): the browser's own prompt when the tab is
 * closed or reloaded, and a dialog for links inside the app.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      returnFocus.current = link;
      setPendingHref(`${url.pathname}${url.search}${url.hash}`);
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const dialog = (
    <Modal
      open={pendingHref !== null}
      onClose={() => setPendingHref(null)}
      title="Leave without saving?"
      description="Your changes to this item haven't been saved."
      returnFocusRef={returnFocus}
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => {
            const href = pendingHref;
            setPendingHref(null);
            if (href) router.push(href);
          }}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface"
        >
          Leave and lose changes
        </button>
        <button
          type="button"
          onClick={() => setPendingHref(null)}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
        >
          Keep editing
        </button>
      </div>
    </Modal>
  );

  return dialog;
}
