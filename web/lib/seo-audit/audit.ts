// Mock SEO audit until the real audit service exists. Results are generated
// deterministically from the URL, and the result id encodes the URL, so a shared result
// page shows the same numbers without any storage. Swap getAudit()/runAudit() for API
// calls later; the result shape can stay the same.
//
// To preview the error states:
//   a URL whose host contains "unreachable" (e.g. https://unreachable.example) -> site unreachable
//   a URL containing "limit"                                                  -> daily limit reached
// The daily limit (DAILY_AUDIT_LIMIT) is also counted for real in localStorage.

export type Rating = "good" | "needs-improvement" | "poor";

export type AuditCheck = {
  id: "title" | "meta-description" | "h1" | "heading-order" | "image-alt" | "viewport" | "canonical";
  label: string;
  passed: boolean;
  detail: string;
};

export type AuditResult = {
  id: string;
  url: string;
  host: string;
  scores: { key: "performance" | "seo" | "accessibility" | "bestPractices"; label: string; value: number }[];
  vitals: { key: "lcp" | "inp" | "cls"; label: string; description: string; display: string; rating: Rating }[];
  checks: AuditCheck[];
  summary: string;
  topFixes: string[];
};

export class InvalidUrlError extends Error {}
export class SiteUnreachableError extends Error {}
export class AuditLimitError extends Error {}

export const DAILY_AUDIT_LIMIT = 3;
const USAGE_KEY = "buzz-crew-audit-usage";

/** The message to show, or null when the URL is fine to audit. */
export function validateAuditUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Enter the address of the page you want to audit.";
  if (!/^https?:\/\//i.test(value)) return "Start the address with http:// or https://, e.g. https://yourbusiness.com.";
  try {
    const url = new URL(value);
    if (!url.hostname.includes(".")) throw new Error("no domain");
  } catch {
    return "That doesn't look like a web address. Check it and try again, e.g. https://yourbusiness.com.";
  }
  return null;
}

function normalise(raw: string) {
  const url = new URL(raw.trim());
  url.hash = "";
  return url.toString();
}

// base64url of the URL. atob/btoa exist in browsers and in Node, so ids round-trip on both.
export function auditId(url: string) {
  const bytes = new TextEncoder().encode(normalise(url));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function urlFromId(id: string): string | null {
  try {
    const binary = atob(id.replace(/-/g, "+").replace(/_/g, "/"));
    const url = new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
    return validateAuditUrl(url) === null ? url : null;
  } catch {
    return null;
  }
}

// Small seeded PRNG so the same URL always gives the same mock results.
function seededRandom(seed: string) {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507);
    state = Math.imul(state ^ (state >>> 13), 3266489909);
    return ((state ^= state >>> 16) >>> 0) / 4294967296;
  };
}

export function scoreRating(score: number): Rating {
  return score >= 90 ? "good" : score >= 50 ? "needs-improvement" : "poor";
}

export const RATING_LABELS: Record<Rating, string> = {
  good: "Good",
  "needs-improvement": "Needs improvement",
  poor: "Poor",
};

const CHECKS: { id: AuditCheck["id"]; label: string; pass: string; fail: string; fix: string }[] = [
  { id: "title", label: "Page title", pass: "The page has a unique title of a good length.", fail: "The title is missing or longer than 60 characters, so Google cuts it off.", fix: "Write a page title under 60 characters that starts with your main service and location." },
  { id: "meta-description", label: "Meta description", pass: "A meta description summarises the page for search results.", fail: "There's no meta description, so Google picks random text for your search snippet.", fix: "Add a meta description (about 150 characters) that tells searchers why to click." },
  { id: "h1", label: "Main heading (H1)", pass: "The page has exactly one H1 heading.", fail: "The page has no H1, or several, which makes its main topic unclear.", fix: "Use one H1 that says what the page is about." },
  { id: "heading-order", label: "Heading order", pass: "Headings follow a logical order (H1, then H2, then H3).", fail: "Heading levels are skipped, which confuses screen readers and search engines.", fix: "Fix the heading order so levels aren't skipped (H2 before H3)." },
  { id: "image-alt", label: "Image alt text", pass: "Every image has alt text.", fail: "Some images have no alt text, so screen readers and Google can't understand them.", fix: "Add short, descriptive alt text to every meaningful image." },
  { id: "viewport", label: "Mobile viewport", pass: "The page is set up to display properly on phones.", fail: "The mobile viewport tag is missing, so phones show a zoomed-out desktop page.", fix: "Add the mobile viewport meta tag so the page fits phone screens." },
  { id: "canonical", label: "Canonical URL", pass: "A canonical tag tells Google which version of the page to index.", fail: "No canonical tag, so duplicate versions of the page may compete in search.", fix: "Add a canonical tag pointing at the preferred URL of the page." },
];

function buildAudit(url: string): AuditResult {
  const random = seededRandom(url);
  const between = (min: number, max: number) => Math.round(min + random() * (max - min));
  const host = new URL(url).hostname.replace(/^www\./, "");

  const scores: AuditResult["scores"] = [
    { key: "performance", label: "Performance", value: between(28, 96) },
    { key: "seo", label: "SEO", value: between(55, 100) },
    { key: "accessibility", label: "Accessibility", value: between(48, 98) },
    { key: "bestPractices", label: "Best practices", value: between(62, 100) },
  ];

  const lcp = between(14, 62) / 10;
  const inp = between(80, 620);
  const cls = between(0, 34) / 100;
  const vitals: AuditResult["vitals"] = [
    { key: "lcp", label: "Largest Contentful Paint", description: "How long the main content takes to appear.", display: `${lcp.toFixed(1)} s`, rating: lcp <= 2.5 ? "good" : lcp <= 4 ? "needs-improvement" : "poor" },
    { key: "inp", label: "Interaction to Next Paint", description: "How quickly the page responds to taps and clicks.", display: `${inp} ms`, rating: inp <= 200 ? "good" : inp <= 500 ? "needs-improvement" : "poor" },
    { key: "cls", label: "Cumulative Layout Shift", description: "How much the layout jumps around while loading.", display: cls.toFixed(2), rating: cls <= 0.1 ? "good" : cls <= 0.25 ? "needs-improvement" : "poor" },
  ];

  const checks = CHECKS.map((check) => {
    const passed = random() > 0.4;
    return { id: check.id, label: check.label, passed, detail: passed ? check.pass : check.fail };
  });

  const failed = CHECKS.filter((check) => !checks.find((item) => item.id === check.id)?.passed);
  const slowVitals = vitals.filter((vital) => vital.rating !== "good");
  const topFixes = [
    ...(slowVitals.some((vital) => vital.key === "lcp") ? ["Compress and resize your largest images, and serve them as WebP, to speed up how fast the page appears."] : []),
    ...failed.map((check) => check.fix),
    ...(slowVitals.some((vital) => vital.key === "inp") ? ["Remove or delay third-party scripts (chat widgets, extra trackers) that slow down taps and clicks."] : []),
  ].slice(0, 3);

  const performance = scores[0].value;
  const summary =
    failed.length === 0 && slowVitals.length === 0
      ? `${host} is in good shape. The basics are all in place, so the next gains will come from content and local SEO rather than technical fixes.`
      : `${host} ${performance < 50 ? "loads slowly on phones" : performance < 90 ? "loads reasonably fast" : "loads quickly"} and ${
          failed.length === 0 ? "passes every on-page check" : `misses ${failed.length} of ${CHECKS.length} on-page checks`
        }. Fixing the items below should make the biggest difference to how you show up on Google and how visitors experience the site.`;

  return { id: auditId(url), url, host, scores, vitals, checks, summary, topFixes: topFixes.length > 0 ? topFixes : ["Keep publishing helpful content and collecting Google reviews."] };
}

/** The result for a shared id, or null if the id isn't valid. */
export async function getAudit(id: string): Promise<AuditResult | null> {
  const url = urlFromId(id);
  return url ? buildAudit(url) : null;
}

function readUsage(): { day: string; count: number } {
  const day = new Date().toISOString().slice(0, 10);
  try {
    const stored = JSON.parse(window.localStorage.getItem(USAGE_KEY) ?? "null");
    if (stored?.day === day && typeof stored.count === "number") return stored;
  } catch {
    // Storage blocked or corrupt: start a fresh count.
  }
  return { day, count: 0 };
}

/** Runs the mock audit (about three seconds) and returns the result id. Browser only. */
export async function runAudit(rawUrl: string): Promise<string> {
  if (validateAuditUrl(rawUrl)) throw new InvalidUrlError();
  const url = normalise(rawUrl);
  const usage = readUsage();
  if (url.includes("limit") || usage.count >= DAILY_AUDIT_LIMIT) throw new AuditLimitError();

  await new Promise((resolve) => setTimeout(resolve, 3000));
  if (new URL(url).hostname.includes("unreachable")) throw new SiteUnreachableError();

  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify({ day: usage.day, count: usage.count + 1 }));
  } catch {
    // Without storage the limit can't be enforced across reloads; that's fine for a mock.
  }
  return auditId(url);
}

/** Mock: emails the full report. To preview the error state, use an email ending in "@fail.test". */
export async function emailAuditReport(input: { id: string; name: string; email: string }): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (input.email.toLowerCase().endsWith("@fail.test")) throw new Error("Mock emailAuditReport failure");
}
