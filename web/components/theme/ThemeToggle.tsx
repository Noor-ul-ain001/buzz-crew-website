"use client";

import { useTheme } from "next-themes";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

const noop = () => () => {};

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

// A small menu: Light, Dark (the default) or System (follows the OS setting).
export default function ThemeToggle({ align = "right" }: { align?: "right" | "left" }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // The theme is only known in the browser, so render a neutral button until hydrated.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const current = mounted ? (theme ?? "dark") : null;
  const currentLabel = OPTIONS.find((option) => option.value === current)?.label;

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface"
      >
        <span className="sr-only">Theme{currentLabel ? `: ${currentLabel}` : ""}</span>
        {mounted && resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />}
      </button>
      <div
        id={menuId}
        hidden={!open}
        className={`absolute top-full z-50 mt-2 w-40 rounded-xl border border-border bg-background p-1 shadow-xl ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Theme</p>
        <ul>
          {OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                aria-pressed={current === option.value}
                onClick={() => {
                  setTheme(option.value);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface aria-pressed:font-semibold"
              >
                {option.label}
                {current === option.value && <span aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
