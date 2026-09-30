"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from "react";

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
  'select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Element that receives focus again after the modal closes (usually the trigger button). */
  returnFocusRef: RefObject<HTMLElement | null>;
  /** "center" is a centred dialog; "wide" a larger one for editors; "drawer" slides in from the right edge (mobile menu). */
  variant?: "center" | "wide" | "drawer";
  children: ReactNode;
};

const VARIANT_CLASSES = {
  center:
    "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl rounded-2xl",
  wide: "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-6xl rounded-2xl",
  drawer:
    "my-0 mr-0 ml-auto h-dvh max-h-none w-80 max-w-[85vw] motion-safe:transition-transform motion-safe:duration-200 motion-safe:starting:open:translate-x-full",
};

// Built on the native <dialog> element: showModal() makes the rest of the page inert and
// puts the dialog in the top layer. Tab cycling, Escape and focus return are handled
// explicitly so behaviour is identical across browsers.
export default function Modal({
  open,
  onClose,
  title,
  description,
  returnFocusRef,
  variant = "center",
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      returnFocusRef.current?.focus();
    }
  }, [open, returnFocusRef]);

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Escape" && event.key !== "Tab") return;
    // React events bubble through the component tree, so a modal opened from inside
    // another one (e.g. the mobile menu) must not let the outer dialog react as well.
    event.stopPropagation();

    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onKeyDown={handleKeyDown}
      // Fired by the browser's own close request (e.g. Escape in some browsers).
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      // Click on the backdrop: the click target is the <dialog> itself, not its content.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={`${VARIANT_CLASSES[variant]} overflow-y-auto overscroll-contain bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60`}
    >
      {open && (
        <div className="p-5 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-2xl font-semibold tracking-tight">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-surface"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
