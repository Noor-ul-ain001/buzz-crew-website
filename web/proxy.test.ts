import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";
import { SESSION_COOKIE } from "@/lib/auth/types";

describe("admin route guard", () => {
  it("sends a signed-out visitor to sign-in and preserves the requested admin URL", () => {
    const response = proxy(new NextRequest("http://localhost:3000/admin/content/posts?status=Draft"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/login?next=%2Fadmin%2Fcontent%2Fposts%3Fstatus%3DDraft",
    );
  });

  it("treats an empty session cookie as signed out", () => {
    const response = proxy(new NextRequest("http://localhost:3000/admin", { headers: { cookie: `${SESSION_COOKIE}=` } }));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/admin/login?next=%2Fadmin");
  });

  it("keeps sign-in and recovery screens public", () => {
    const response = proxy(new NextRequest("http://localhost:3000/admin/forgot-password"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps staff sign-up public and never lets admin pages be indexed", () => {
    const signup = proxy(new NextRequest("http://localhost:3000/admin/signup"));
    expect(signup.status).toBe(200);
    expect(signup.headers.get("x-robots-tag")).toBe("noindex, nofollow");

    const guarded = proxy(new NextRequest("http://localhost:3000/admin/leads"));
    expect(guarded.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
});
