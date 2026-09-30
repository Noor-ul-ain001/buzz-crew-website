// Dates are shown in the agency's own time zone so every visitor (and the server
// render) sees the same day, wherever they are.
export const BUSINESS_TIME_ZONE = "Asia/Karachi";

/** YYYY-MM-DD in the business time zone. */
export function toBusinessDay(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE }).format(new Date(iso));
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: BUSINESS_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: BUSINESS_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return dateTimeFormat.format(new Date(iso));
}

const longDateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: BUSINESS_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "28 September 2026", for public pages. */
export function formatLongDate(iso: string) {
  return longDateFormat.format(new Date(iso));
}
