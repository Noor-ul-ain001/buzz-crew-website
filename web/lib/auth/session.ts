import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import createClient from "openapi-fetch";
import type { paths } from "@/lib/api/schema";
import { SESSION_COOKIE, type Me, type Role } from "./types";

// Server-only: rendering happens next to the API, so this skips the /api/v1 rewrite.
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8000";

async function loginRedirect(reason: string): Promise<never> {
  const path = (await headers()).get("x-admin-path") ?? "/admin";
  redirect(`/admin/login?reason=${reason}&next=${encodeURIComponent(path)}`);
}

/** API client that forwards the visitor's session cookie. */
export async function serverApi() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return createClient<paths>({
    baseUrl: API_ORIGIN,
    headers: token ? { cookie: `${SESSION_COOKIE}=${token}` } : {},
  });
}

/** The signed-in team member, checked with the API once per request. */
export const getCurrentUser = cache(async (): Promise<Me> => {
  const api = await serverApi();
  const { data, response } = await api.GET("/api/v1/auth/me", { cache: "no-store" });
  if (response.status === 401) return loginRedirect("expired");
  if (!data) throw new Error("Couldn't check your session.");
  return data;
});

/** Returns the user when they hold `role` (admins hold every role), otherwise null. */
export async function requireRole(role: Role): Promise<Me | null> {
  const user = await getCurrentUser();
  return user.role === role || user.role === "admin" ? user : null;
}
