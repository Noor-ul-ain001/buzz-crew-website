import type { Metadata } from "next";
import NewPasswordForm from "@/components/admin/auth/NewPasswordForm";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/admin/reset-password">) {
  const { token } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>
      <NewPasswordForm mode="reset" token={typeof token === "string" ? token : ""} />
    </>
  );
}
