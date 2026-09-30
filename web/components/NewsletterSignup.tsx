"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { subscribeToNewsletter } from "@/lib/data/newsletter";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Double opt-in: after signing up, the visitor confirms from their inbox.
export default function NewsletterSignup() {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setError(value ? "Please enter a valid email address, e.g. name@company.com." : "Please enter your email address.");
      inputRef.current?.focus();
      return;
    }
    setError("");
    setStatus("sending");
    try {
      await subscribeToNewsletter(value);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <h2 id={`${id}-heading`} className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">
        Newsletter
      </h2>
      {/* Always mounted so the confirmation is announced when it appears. */}
      <div role="status">
        {status === "sent" && (
          <div className="mt-3 rounded-xl border border-border bg-background p-4">
            <p className="font-semibold">Check your inbox to confirm</p>
            <p className="mt-1 text-sm text-muted">
              We&apos;ve sent a link to <span className="font-medium text-foreground">{email.trim()}</span>. Click it to
              start getting our monthly tips.
            </p>
          </div>
        )}
      </div>
      {status !== "sent" && (
        <form onSubmit={handleSubmit} noValidate aria-labelledby={`${id}-heading`} className="mt-3">
          <p id={`${id}-hint`} className="text-sm text-muted">
            One email a month with marketing tips. Unsubscribe any time.
          </p>
          <label htmlFor={`${id}-email`} className="sr-only">
            Email address
          </label>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <input
              ref={inputRef}
              id={`${id}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-hint ${id}-error` : `${id}-hint`}
              className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm aria-[invalid=true]:border-danger"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-background hover:opacity-90 disabled:opacity-60"
            >
              {status === "sending" ? "Subscribing…" : "Subscribe"}
            </button>
          </div>
          {error && (
            <p id={`${id}-error`} className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="mt-2 text-sm text-danger">
              That didn&apos;t work. Please try again in a moment.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
