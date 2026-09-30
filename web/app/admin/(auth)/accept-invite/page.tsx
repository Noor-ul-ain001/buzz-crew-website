import type { Metadata } from "next";
import NewPasswordForm from "@/components/admin/auth/NewPasswordForm";

export const metadata: Metadata = { title: "Accept your invitation" };

export default async function AcceptInvitePage({ searchParams }: PageProps<"/admin/accept-invite">) {
  const { token } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Welcome to The Buzz Crew admin</h1>
      <p className="mt-2 text-sm text-muted">Choose a password to finish setting up your account.</p>
      <NewPasswordForm mode="invite" token={typeof token === "string" ? token : ""} />
    </>
  );
}
