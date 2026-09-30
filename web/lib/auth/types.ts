import type { Schemas } from "@/lib/api/client";

export type Role = Schemas["UserRole"];
export type Me = Schemas["Me"];
export type TeamUser = Schemas["UserOut"];

export const SESSION_COOKIE = "bc_session";

export const PASSWORD_RULES =
  "Use at least 12 characters. A few unrelated words make a strong, memorable password. " +
  "Avoid common passwords and anything based on your email address.";

/** Only same-site admin paths are honoured, so a crafted link can't bounce people elsewhere. */
export function safeNext(next: string | string[] | undefined): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || value.startsWith("//") || value.includes("\\")) return "/admin";
  if (value === "/admin" || value.startsWith("/admin/") || value.startsWith("/admin?")) return value;
  return "/admin";
}
