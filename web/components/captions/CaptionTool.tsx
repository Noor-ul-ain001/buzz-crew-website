"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import CopyButton from "@/components/ui/CopyButton";
import {
  CaptionLimitError,
  DAILY_CAPTION_LIMIT,
  GOALS,
  PLATFORMS,
  generateCaptions,
  type CaptionIdea,
  type Goal,
  type Platform,
} from "@/lib/captions/mock";
import { WHATSAPP_URL } from "@/lib/site";

export default function CaptionTool() {
  const id = useId();
  const businessRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const [business, setBusiness] = useState("");
  const [goal, setGoal] = useState<Goal>("enquiries");
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "limit">("idle");
  const [ideas, setIdeas] = useState<CaptionIdea[]>([]);
  const [generatedFor, setGeneratedFor] = useState<Platform>("Instagram");

  useEffect(() => {
    if (status === "done" || status === "limit") resultsRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business.trim()) {
      setError("Tell us what kind of business you run, e.g. bakery, dental clinic or boutique.");
      businessRef.current?.focus();
      return;
    }
    setError("");
    setStatus("loading");
    try {
      setIdeas(await generateCaptions({ business, goal, platform }));
      setGeneratedFor(platform);
      setStatus("done");
    } catch (caught) {
      setStatus(caught instanceof CaptionLimitError ? "limit" : "idle");
    }
  }

  const inputClass = "mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-base aria-[invalid=true]:border-danger";

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={handleSubmit} noValidate className="rounded-3xl border border-border p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-business`} className="text-sm font-medium">
              Type of business
            </label>
            <input
              ref={businessRef}
              id={`${id}-business`}
              type="text"
              value={business}
              onChange={(event) => setBusiness(event.target.value)}
              placeholder="e.g. Bakery"
              maxLength={60}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-business-error` : undefined}
              className={inputClass}
            />
            {error && (
              <p id={`${id}-business-error`} className="mt-1 text-sm text-danger">
                {error}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={`${id}-goal`} className="text-sm font-medium">
              Goal
            </label>
            <select id={`${id}-goal`} value={goal} onChange={(event) => setGoal(event.target.value as Goal)} className={inputClass}>
              {GOALS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Platform</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PLATFORMS.map((option) => (
              <label
                key={option}
                className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-medium has-checked:border-foreground has-checked:bg-foreground has-checked:text-background has-focus-visible:outline-2 has-focus-visible:outline-foreground"
              >
                <input
                  type="radio"
                  name={`${id}-platform`}
                  value={option}
                  checked={platform === option}
                  onChange={() => setPlatform(option)}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-6 rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-foreground hover:brightness-95 disabled:opacity-60"
        >
          {status === "loading" ? "Writing ideas…" : "Generate post ideas"}
        </button>
        <p role="status" className="sr-only">
          {status === "loading" ? "Writing your post ideas." : ""}
        </p>
      </form>

      {status === "limit" && (
        <section role="alert" className="rounded-3xl border border-danger/50 p-6 sm:p-8">
          <h2 ref={resultsRef} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none">
            You&apos;ve used today&apos;s free ideas
          </h2>
          <p className="mt-2 text-muted">
            The tool writes up to {DAILY_CAPTION_LIMIT} sets of ideas a day. Come back tomorrow, or let our social team plan a
            whole month of content for you.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-full bg-foreground px-5 py-2.5 font-semibold text-background hover:opacity-90">
              Talk to the team
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-5 py-2.5 font-medium hover:bg-surface">
              WhatsApp us<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </section>
      )}

      {status === "done" && (
        <section aria-labelledby={`${id}-results`}>
          <div className="flex flex-wrap items-center gap-3">
            <h2 id={`${id}-results`} ref={resultsRef} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none">
              {ideas.length} post ideas for {generatedFor}
            </h2>
            <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">AI-generated</span>
          </div>
          <p className="mt-1 text-sm text-muted">Starting points, not finished posts. Check facts and prices, and make them sound like you.</p>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {ideas.map((idea) => (
              <li key={idea.id} className="flex flex-col gap-3 rounded-2xl border border-border p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{idea.format}</p>
                  <h3 className="mt-1 text-lg font-semibold">{idea.title}</h3>
                </div>
                <p className="leading-relaxed whitespace-pre-line">{idea.caption}</p>
                <p className="text-sm font-medium text-muted">{idea.hashtags.join(" ")}</p>
                <div className="mt-auto pt-2">
                  <CopyButton value={`${idea.caption}\n\n${idea.hashtags.join(" ")}`} label={`caption for “${idea.title}”`} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
