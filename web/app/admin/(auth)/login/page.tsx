import type { Metadata } from "next";
import LoginForm from "@/components/admin/auth/LoginForm";
import { safeNext } from "@/lib/auth/types";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  idle: "You were signed out due to inactivity.",
  expired: "Your session ended. Please sign in again.",
  signed_out: "You've signed out.",
  reset: "Your password was changed. Sign in with your new password.",
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams;
  const reason = typeof params.reason === "string" ? params.reason : undefined;
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Sign in to admin</h1>
      {reason && NOTICES[reason] && (
        <p role="status" className="mt-4 rounded-lg bg-background px-3.5 py-2.5 text-sm">
          {NOTICES[reason]}
        </p>
      )}
      <LoginForm next={safeNext(params.next)} />
    </>
  );
}
