import { track as vercelTrack } from "@vercel/analytics";

// Every tracked event and the only properties it may carry. Keeping this a closed type means
// personal data (names, emails, phones, messages) can't be sent by accident (constitution V).
type EventProps = {
  inquiry_submitted: { source_page: string };
  whatsapp_clicked: { source_page: string };
  // Case studies (005): slugs and filter names only, never visitor data.
  case_study_viewed: { case_study: string };
  work_filter_used: { filter: "industry" | "service" };
  similar_project_clicked: { case_study: string };
};

export type AnalyticsEvent = keyof EventProps;

export function track<E extends AnalyticsEvent>(event: E, props: EventProps[E]): void {
  try {
    vercelTrack(event, props);
  } catch {
    // Analytics must never break the page (e.g. blocked by an ad blocker).
  }
}

/** Current path without query string or hash, which could contain campaign identifiers. */
export function currentSourcePage(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname.slice(0, 200) || "/";
}
