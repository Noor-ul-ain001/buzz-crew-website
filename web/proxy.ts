import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/types";

// Cookie presence only: the API validates the session on every request (003 T017).
// Signed-out visitors go to sign-in and come back to where they were heading.
const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/admin/signup",
  "/admin/forgot-password",
  "/admin/reset-password",
  "/admin/accept-invite",
]);

// Admin screens never belong in search results, whatever the page's own metadata says.
function noIndex(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return noIndex(NextResponse.next());

  // A cookie name alone is not proof of a session: browsers can send an empty cookie.
  // The protected layout validates non-empty tokens with the API on every render.
  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return noIndex(NextResponse.redirect(login));
  }

  // Lets the admin layout send an expired session back to the same page after sign-in.
  const headers = new Headers(request.headers);
  headers.set("x-admin-path", `${pathname}${search}`);
  return noIndex(NextResponse.next({ request: { headers } }));
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
