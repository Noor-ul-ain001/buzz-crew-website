import { markActivity } from "@/lib/auth/activity";

export type ApiResult<T> = { ok: boolean; status: number; data: T | null; error: unknown };

/**
 * Untyped same-origin call for routes whose path is built at runtime (one set of content
 * routes per type). Prefer the typed `api` client from ./client when the path is fixed.
 */
export async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
  });
  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (response.ok) markActivity();
  return {
    ok: response.ok,
    status: response.status,
    data: response.ok ? (parsed as T) : null,
    error: response.ok ? null : parsed,
  };
}
