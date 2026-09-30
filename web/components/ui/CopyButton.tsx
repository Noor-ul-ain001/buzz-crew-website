"use client";

import { useEffect, useState } from "react";

// `label` names what is copied, for screen readers and the confirmation, e.g. "email address".
export default function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:bg-surface"
      >
        {state === "copied" ? "Copied" : "Copy"}
        <span className="sr-only"> {label}</span>
      </button>
      <span role="status" className="text-sm text-muted">
        {state === "copied" && `${label.charAt(0).toUpperCase()}${label.slice(1)} copied.`}
        {state === "failed" && `Couldn't copy. Please select the ${label} instead.`}
      </span>
    </span>
  );
}
