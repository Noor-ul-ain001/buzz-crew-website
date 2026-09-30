"use client";

import { useId, useState, type ReactNode } from "react";

// Shows on hover and keyboard focus, stays open while the pointer is over it, and closes
// with Escape (WCAG 1.4.13). The trigger gets aria-describedby, so screen readers read
// the text too. When `content` is null there is no tooltip.
export default function Tooltip({
  content,
  children,
  align = "center",
  className = "",
}: {
  content: string | null;
  children: (describedBy: string | undefined) => ReactNode;
  align?: "center" | "end";
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);

  if (!content) return <>{children(undefined)}</>;

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      {children(id)}
      <span
        id={id}
        role="tooltip"
        className={`absolute bottom-full z-30 mb-2 w-60 rounded-lg bg-foreground px-3 py-2 text-left text-xs font-medium text-background shadow-lg ${
          align === "end" ? "right-0" : "left-1/2 -translate-x-1/2"
        } ${open ? "block" : "hidden"}`}
      >
        {content}
      </span>
    </span>
  );
}
