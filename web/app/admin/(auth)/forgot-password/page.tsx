import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/admin/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
      <p className="mt-2 text-sm text-muted">Enter your work email and we&apos;ll send you a link to choose a new password.</p>
      <ForgotPasswordForm />
    </>
  );
}
