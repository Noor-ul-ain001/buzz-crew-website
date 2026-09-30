"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  AuditLimitError,
  DAILY_AUDIT_LIMIT,
  SiteUnreachableError,
  runAudit,
  validateAuditUrl,
} from "@/lib/seo-audit/audit";
import { WHATSAPP_URL } from "@/lib/site";

const STEPS = ["Checking speed", "Reading your page", "Writing your summary"];
const STEP_MS = 1000;

type State =
  | { name: "form" }
  | { name: "running"; url: string }
  | { name: "unreachable"; url: string }
  | { name: "limit" };

export default function SeoAuditTool() {
  const router = useRouter();
  const id = useId();
  const urlRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [state, setState] = useState<State>({ name: "form" });
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<{ url?: string }>({});
  const [step, setStep] = useState(0);

  // Advance the progress steps while the audit runs.
  useEffect(() => {
    if (state.name !== "running") return;
    const timers = STEPS.slice(1).map((_, index) => setTimeout(() => setStep(index + 1), STEP_MS * (index + 1)));
    return () => timers.forEach(clearTimeout);
  }, [state.name]);

  // Move focus to the heading of each new view so keyboard and screen reader users follow.
  useEffect(() => {
    if (state.name !== "form") headingRef.current?.focus();
  }, [state.name]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const urlError = validateAuditUrl(url) ?? undefined;
    setErrors({ url: urlError });
    if (urlError) {
      urlRef.current?.focus();
      return;
    }

    setStep(0);
    setState({ name: "running", url: url.trim() });
    try {
      const resultId = await runAudit(url);
      router.push(`/tools/seo-audit/${resultId}`);
    } catch (error) {
      if (error instanceof AuditLimitError) setState({ name: "limit" });
      else if (error instanceof SiteUnreachableError) setState({ name: "unreachable", url: url.trim() });
      else setState({ name: "unreachable", url: url.trim() });
    }
  }

  if (state.name === "running") {
    return (
      <div className="rounded-3xl border border-border p-6 sm:p-10">
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none">
          Auditing <span className="break-all">{state.url}</span>
        </h2>
        <p className="mt-1 text-muted">This takes a few seconds. Please keep this page open.</p>
        <ol className="mt-8 flex flex-col gap-4">
          {STEPS.map((label, index) => {
            const done = index < step;
            const current = index === step;
            return (
              <li key={label} aria-current={current ? "step" : undefined} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${
                    done ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-zinc-950" : current ? "border-foreground" : "border-border"
                  }`}
                >
                  {done ? (
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  ) : current ? (
                    <span className="size-4 rounded-full border-2 border-foreground border-t-transparent motion-safe:animate-spin" />
                  ) : null}
                </span>
                <span className={done || current ? "font-medium" : "text-muted"}>
                  {label}
                  <span className="sr-only">{done ? " (done)" : current ? " (in progress)" : " (waiting)"}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p role="status" className="sr-only">
          {STEPS[step]}…
        </p>
      </div>
    );
  }

  if (state.name === "unreachable" || state.name === "limit") {
    const unreachable = state.name === "unreachable";
    return (
      <div role="alert" className="rounded-3xl border border-danger/50 p-6 sm:p-10">
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none">
          {unreachable ? "We couldn't reach that site" : "You've used today's free audits"}
        </h2>
        {unreachable ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
            <li>
              Check the address is right: <span className="font-medium break-all text-foreground">{state.url}</span>
            </li>
            <li>Make sure the site is live and not behind a password or &ldquo;coming soon&rdquo; page.</li>
            <li>Some firewalls block automated checks. If that&apos;s you, ask us for a manual audit.</li>
          </ul>
        ) : (
          <p className="mt-3 text-muted">
            The free tool runs up to {DAILY_AUDIT_LIMIT} audits a day. Come back tomorrow, or ask the team for a full manual
            audit.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {unreachable && (
            <button
              type="button"
              onClick={() => setState({ name: "form" })}
              className="rounded-full bg-foreground px-5 py-2.5 font-semibold text-background hover:opacity-90"
            >
              Try another address
            </button>
          )}
          <Link href="/contact" className="rounded-full border border-border px-5 py-2.5 font-medium hover:bg-surface">
            Ask for a manual audit
          </Link>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-5 py-2.5 font-medium hover:bg-surface">
            WhatsApp us<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-3xl border border-border p-6 sm:p-8">
      <label htmlFor={`${id}-url`} className="text-sm font-medium">
        Website address
      </label>
      <div className="mt-1.5 flex flex-col gap-3 sm:flex-row">
        <input
          ref={urlRef}
          id={`${id}-url`}
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://yourbusiness.com"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          aria-invalid={errors.url ? true : undefined}
          aria-describedby={errors.url ? `${id}-url-hint ${id}-url-error` : `${id}-url-hint`}
          className="min-w-0 flex-1 rounded-full border border-border bg-background px-5 py-3.5 text-base aria-[invalid=true]:border-danger"
        />
        <button type="submit" className="rounded-full bg-accent px-6 py-3.5 font-semibold whitespace-nowrap text-accent-foreground hover:brightness-95">
          Run free audit
        </button>
      </div>
      <p id={`${id}-url-hint`} className="mt-2 text-sm text-muted">
        Include http:// or https://. We&apos;ll check the page you enter, usually your homepage.
      </p>
      {errors.url && (
        <p id={`${id}-url-error`} className="mt-1 text-sm text-danger">
          {errors.url}
        </p>
      )}
    </form>
  );
}
