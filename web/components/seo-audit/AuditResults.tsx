import { RATING_LABELS, scoreRating, type AuditResult, type Rating } from "@/lib/seo-audit/audit";

// Colour is never the only signal: every score and vital also shows its rating in words.
const RATING_STYLES: Record<Rating, { text: string; badge: string }> = {
  good: {
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  },
  "needs-improvement": {
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  poor: {
    text: "text-red-600 dark:text-red-400",
    badge: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  },
};

function ScoreDial({ label, value }: { label: string; value: number }) {
  const rating = scoreRating(value);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <li className="flex flex-col items-center gap-2 rounded-2xl border border-border p-5 text-center">
      <div className="relative size-28">
        <svg viewBox="0 0 100 100" className={`size-28 -rotate-90 ${RATING_STYLES[rating].text}`} aria-hidden="true">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - value / 100)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold tabular-nums">{value}</span>
      </div>
      <p className="font-semibold">
        {label}
        <span className="sr-only">: {value} out of 100</span>
      </p>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${RATING_STYLES[rating].badge}`}>{RATING_LABELS[rating]}</span>
    </li>
  );
}

export default function AuditResults({ result }: { result: AuditResult }) {
  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="scores-heading">
        <h2 id="scores-heading" className="text-2xl font-bold tracking-tight">
          Scores
        </h2>
        <p className="mt-1 text-sm text-muted">Out of 100. 90 and above is good, 50 to 89 needs improvement, below 50 is poor.</p>
        <ul className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {result.scores.map((score) => (
            <ScoreDial key={score.key} label={score.label} value={score.value} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="summary-heading" className="rounded-3xl border-2 border-accent bg-accent/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="summary-heading" className="text-2xl font-bold tracking-tight">
            Summary and top fixes
          </h2>
          <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">AI-generated</span>
        </div>
        <p className="mt-3 text-lg">{result.summary}</p>
        <ol className="mt-5 flex flex-col gap-3">
          {result.topFixes.map((fix, index) => (
            <li key={fix} className="flex gap-3">
              <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                {index + 1}
              </span>
              <span className="pt-0.5">{fix}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-muted">
          This summary was written by AI from the results on this page and may contain mistakes. Check with the team before
          making big changes.
        </p>
      </section>

      <section aria-labelledby="vitals-heading">
        <h2 id="vitals-heading" className="text-2xl font-bold tracking-tight">
          Core Web Vitals
        </h2>
        <p className="mt-1 text-sm text-muted">How real visitors experience the page on mobile.</p>
        <ul className="mt-5 grid gap-4 md:grid-cols-3">
          {result.vitals.map((vital) => (
            <li key={vital.key} className="rounded-2xl border border-border p-5">
              <p className="font-semibold">{vital.label}</p>
              <p className="mt-1 text-sm text-muted">{vital.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className={`text-3xl font-bold tabular-nums ${RATING_STYLES[vital.rating].text}`}>{vital.display}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${RATING_STYLES[vital.rating].badge}`}>
                  {RATING_LABELS[vital.rating]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="checks-heading">
        <h2 id="checks-heading" className="text-2xl font-bold tracking-tight">
          On-page checks
        </h2>
        <p className="mt-1 text-sm text-muted">
          {result.checks.filter((check) => check.passed).length} of {result.checks.length} passed.
        </p>
        <ul className="mt-5 divide-y divide-border rounded-2xl border border-border">
          {result.checks.map((check) => (
            <li key={check.id} className="flex gap-4 p-4 sm:p-5">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  check.passed ? RATING_STYLES.good.badge : RATING_STYLES.poor.badge
                }`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  {check.passed ? <path d="M5 12l5 5L20 7" /> : <path d="M6 6l12 12M18 6L6 18" />}
                </svg>
              </span>
              <div>
                <p className="font-semibold">
                  {check.label}
                  <span className="sr-only">: {check.passed ? "passed" : "failed"}</span>
                </p>
                <p className="mt-0.5 text-muted">{check.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
