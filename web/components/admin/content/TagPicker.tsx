"use client";

import { useId, useState, type KeyboardEvent } from "react";

// Tags as removable chips. Type and press Enter or comma to add; existing tags are
// suggested as you type (native datalist) so the same tag isn't spelled two ways.
export default function TagPicker({
  value,
  onChange,
  suggestions,
  max = 6,
  error,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  max?: number;
  error?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const full = value.length >= max;

  function add(raw: string) {
    const name = raw.trim().replace(/,+$/, "");
    if (!name) return;
    // Reuse the existing spelling of a tag typed in a different case.
    const existing = suggestions.find((tag) => tag.toLowerCase() === name.toLowerCase()) ?? name;
    if (!value.some((tag) => tag.toLowerCase() === existing.toLowerCase()) && !full) onChange([...value, existing]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  const unused = suggestions.filter((tag) => !value.some((chosen) => chosen.toLowerCase() === tag.toLowerCase()));

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-input`} className="text-sm font-medium">
        Tags <span className="font-normal text-muted">(up to {max})</span>
      </label>
      {value.length > 0 && (
        <ul aria-label="Chosen tags" className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <li key={tag} className="inline-flex items-center gap-1 rounded-full bg-surface py-1 pr-1 pl-3 text-sm font-medium">
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== tag))}
                className="inline-flex size-6 items-center justify-center rounded-full text-muted hover:bg-border hover:text-foreground"
              >
                <span className="sr-only">Remove tag {tag}</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={`${id}-input`}
        type="text"
        list={`${id}-suggestions`}
        value={draft}
        disabled={full}
        onChange={(event) => {
          const next = event.target.value;
          // Picking a suggestion from the datalist adds it straight away.
          if (unused.includes(next)) add(next);
          else setDraft(next);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => add(draft)}
        placeholder={full ? "Tag limit reached" : "Type a tag and press Enter"}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        aria-invalid={error ? true : undefined}
        className="block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm disabled:opacity-60 aria-[invalid=true]:border-danger"
      />
      <datalist id={`${id}-suggestions`}>
        {unused.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
      <p id={`${id}-hint`} className="text-xs text-muted">
        Reuse existing tags where you can. Backspace removes the last one.
      </p>
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
