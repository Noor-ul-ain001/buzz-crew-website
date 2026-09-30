"use client";

import { useId, useState, type FormEvent } from "react";
import { useLeads } from "@/components/admin/LeadsProvider";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/format";
import type { Lead } from "@/lib/leads/types";

const MAX_NOTE_LENGTH = 2000;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function NotesThread({ lead }: { lead: Lead }) {
  const { addNote } = useLeads();
  const toast = useToast();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fieldId = useId();
  const errorId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text) {
      setError("Write a note before adding it.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await addNote(lead.id, text);
      setBody("");
      toast("Note added.");
    } catch {
      setError("Couldn't add the note. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4">
      {lead.notes.length === 0 ? (
        <p className="text-sm text-muted">No notes yet. Add the first one below.</p>
      ) : (
        <ol className="flex flex-col gap-5">
          {lead.notes.map((note) => (
            <li key={note.id} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold"
              >
                {initials(note.author)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{note.author}</span>{" "}
                  <time dateTime={note.createdAt} className="text-muted">
                    {formatDateTime(note.createdAt)}
                  </time>
                </p>
                <p className="mt-1 leading-relaxed whitespace-pre-wrap break-words">{note.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 border-t border-border pt-5">
        <label htmlFor={fieldId} className="text-sm font-semibold">
          Add a note
        </label>
        <textarea
          id={fieldId}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            // Ctrl/⌘ + Enter adds the note without reaching for the mouse.
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={3}
          maxLength={MAX_NOTE_LENGTH}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder="Call summary, next steps, anything the crew should know"
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none aria-invalid:border-danger"
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {body.length > MAX_NOTE_LENGTH - 200 && `${MAX_NOTE_LENGTH - body.length} characters left`}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add note"}
          </button>
        </div>
      </form>
    </div>
  );
}
