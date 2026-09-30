import type { Metadata } from "next";
import SignupForm from "@/components/admin/auth/SignupForm";

export const metadata: Metadata = { title: "Create a staff account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Create a staff account</h1>
      <p className="mt-2 text-sm text-muted">For Buzz Crew team members. You&apos;ll need the sign-up code from an admin.</p>
      <SignupForm />
    </>
  );
}
