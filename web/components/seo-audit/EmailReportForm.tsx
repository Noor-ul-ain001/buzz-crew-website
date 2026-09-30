"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { emailAuditReport } from "@/lib/seo-audit/audit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailReportForm({ auditId }: { auditId: string }) {
  const id = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (status === "sent") successRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      name: name.trim() ? undefined : "Please enter your name.",
      email: !email.trim()
        ? "Please enter your email address."
        : EMAIL_PATTERN.test(email.trim())
          ? undefined
          : "Please enter a valid email address, e.g. name@company.com.",
    };
    setErrors(next);
    if (next.name) return nameRef.current?.focus();
    if (next.email) return emailRef.current?.focus();

    setStatus("sending");
    try {
      await emailAuditReport({ id: auditId, name: name.trim(), email: email.trim() });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div>
        <h2 ref={successRef} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none">
          Report on its way
        </h2>
        <p className="mt-2 text-muted">
          We&apos;ve sent the full report to <span className="font-medium text-foreground">{email.trim()}</span>. It should arrive
          in a few minutes; check your spam folder if not.
        </p>
      </div>
    );
  }

  const inputClass =
    "mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-base aria-[invalid=true]:border-danger";

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="text-2xl font-bold tracking-tight">
        Email me the full report
      </h2>
      <p className="mt-1 text-muted">A detailed PDF with every check, plus how to fix each one.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="text-sm font-medium">
            Name
          </label>
          <input
            ref={nameRef}
            id={`${id}-name`}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${id}-name-error` : undefined}
            className={inputClass}
          />
          {errors.name && (
            <p id={`${id}-name-error`} className="mt-1 text-sm text-danger">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="text-sm font-medium">
            Email
          </label>
          <input
            ref={emailRef}
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? `${id}-email-error` : undefined}
            className={inputClass}
          />
          {errors.email && (
            <p id={`${id}-email-error`} className="mt-1 text-sm text-danger">
              {errors.email}
            </p>
          )}
        </div>
      </div>
      {status === "error" && (
        <p role="alert" className="mt-4 text-sm text-danger">
          We couldn&apos;t send the report. Please try again in a moment.
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-5 rounded-full bg-foreground px-6 py-3 font-semibold text-background hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Email me the report"}
      </button>
      <p className="mt-3 text-sm text-muted">We&apos;ll only use your email to send this report and one follow-up.</p>
    </form>
  );
}
