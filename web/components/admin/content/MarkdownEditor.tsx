"use client";

import { useDeferredValue, useId, useRef, useState } from "react";
import Markdown from "@/components/blog/Markdown";

type Format = {
  label: string;
  short: string;
  apply: (selected: string) => { text: string; select?: [number, number] };
  /** Line formats go at the start of the line(s). */
  block?: boolean;
};

const FORMATS: Format[] = [
  { label: "Heading", short: "H2", block: true, apply: (s) => ({ text: `## ${s || "Heading"}` }) },
  { label: "Subheading", short: "H3", block: true, apply: (s) => ({ text: `### ${s || "Subheading"}` }) },
  { label: "Bold", short: "B", apply: (s) => ({ text: `**${s || "bold text"}**`, select: [2, 2 + (s || "bold text").length] }) },
  { label: "Italic", short: "I", apply: (s) => ({ text: `_${s || "italic text"}_`, select: [1, 1 + (s || "italic text").length] }) },
  { label: "Link", short: "Link", apply: (s) => ({ text: `[${s || "link text"}](https://)`, select: [(s || "link text").length + 3, (s || "link text").length + 11] }) },
  { label: "Bulleted list", short: "• List", block: true, apply: (s) => ({ text: (s || "List item").split("\n").map((line) => `- ${line}`).join("\n") }) },
  { label: "Numbered list", short: "1. List", block: true, apply: (s) => ({ text: (s || "List item").split("\n").map((line, i) => `${i + 1}. ${line}`).join("\n") }) },
  { label: "Quote", short: "Quote", block: true, apply: (s) => ({ text: (s || "Quote").split("\n").map((line) => `> ${line}`).join("\n") }) },
  { label: "Code block", short: "Code", block: true, apply: (s) => ({ text: `~~~\n${s || "code"}\n~~~` }) },
  {
    label: "Image",
    short: "Image",
    block: true,
    apply: () => ({ text: "![Describe the image](https://)", select: [2, 20] }),
  },
];

// A plain textarea with a formatting toolbar and a live preview rendered by the same
// component as the public blog. Side by side on wide screens, Write/Preview tabs below.
export default function MarkdownEditor({
  value,
  onChange,
  label,
  error,
  hint,
  required = true,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** Marks the field as required to publish (blog posts). */
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  // Rendering Markdown on every keystroke is cheap, but defer it so typing never lags.
  const preview = useDeferredValue(value);

  function format(item: Format) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    let start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    // Block formats start at the beginning of the line.
    if (item.block) start = value.lastIndexOf("\n", start - 1) + 1;
    const selected = value.slice(start, end);
    const { text, select } = item.apply(selected);
    // Block formats sit on their own line.
    const before = item.block && start > 0 && value[start - 1] !== "\n" ? "\n" : "";
    const next = value.slice(0, start) + before + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const base = start + before.length;
      if (select) textarea.setSelectionRange(base + select[0], base + select[1]);
      else textarea.setSelectionRange(base + text.length, base + text.length);
    });
  }

  const tabClass =
    "rounded-full px-3 py-1 text-sm font-medium aria-pressed:bg-foreground aria-pressed:text-background lg:hidden";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label htmlFor={`${id}-body`} className="text-sm font-medium">
          {label}
          {required && (
            <>
              {" "}
              <span className="text-danger" aria-hidden="true">
                *
              </span>
              <span className="sr-only">(required to publish)</span>
            </>
          )}
        </label>
        <div role="group" aria-label="Editor view" className="flex gap-1 lg:hidden">
          <button type="button" aria-pressed={tab === "write"} onClick={() => setTab("write")} className={tabClass}>
            Write
          </button>
          <button type="button" aria-pressed={tab === "preview"} onClick={() => setTab("preview")} className={tabClass}>
            Preview
          </button>
        </div>
      </div>

      <div className="grid overflow-hidden rounded-xl border border-border lg:grid-cols-2">
        <div className={`flex flex-col ${tab === "write" ? "" : "hidden"} lg:flex`}>
          <div role="group" aria-label="Formatting" className="flex flex-wrap gap-1 border-b border-border bg-surface p-2">
            {FORMATS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => format(item)}
                aria-label={item.label}
                title={item.label}
                className="rounded-md px-2 py-1 font-mono text-xs font-semibold hover:bg-background"
              >
                {item.short}
              </button>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            id={`${id}-body`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            spellCheck
            aria-invalid={error ? true : undefined}
            aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}
            className="min-h-[32rem] flex-1 resize-y bg-background p-4 font-mono text-sm leading-relaxed focus-visible:-outline-offset-2"
          />
        </div>
        <section
          aria-label="Preview"
          className={`min-h-[32rem] overflow-y-auto border-border bg-background p-5 lg:max-h-[40rem] lg:border-l ${
            tab === "preview" ? "" : "hidden"
          } lg:block`}
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">Preview</p>
          {preview.trim() ? <Markdown markdown={preview} /> : <p className="text-muted">Nothing to preview yet.</p>}
        </section>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
