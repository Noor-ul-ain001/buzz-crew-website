"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FormField, { ariaFor, inputClass } from "@/components/ui/FormField";
import { api } from "@/lib/api/client";
import { errorCode, errorMessage } from "@/lib/auth/errors";
import { PASSWORD_RULES } from "@/lib/auth/types";

const schema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters.").max(128, "Use at most 128 characters."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords don't match." });
type Values = z.infer<typeof schema>;

/** Sets a password from an emailed link: a reset (1 hour) or an invitation (72 hours). */
export default function NewPasswordForm({ mode, token }: { mode: "reset" | "invite"; token: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [linkInvalid, setLinkInvalid] = useState(token.length < 32);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    const body = { token, password };
    const { error, response } =
      mode === "reset"
        ? await api.POST("/api/v1/auth/password-reset/confirm", { body })
        : await api.POST("/api/v1/invitations/accept", { body });
    if (response.ok) {
      router.replace(mode === "reset" ? "/admin/login?reason=reset" : "/admin");
      router.refresh();
      return;
    }
    const code = errorCode(error);
    if (code === "invalid_or_expired_token") setLinkInvalid(true);
    else if (code === "weak_password") setError("password", { message: errorMessage(error) }, { shouldFocus: true });
    else setFormError(errorMessage(error));
  });

  if (linkInvalid) {
    return (
      <div className="mt-6 flex flex-col gap-4">
        <p role="alert" className="rounded-lg border border-danger/40 px-3.5 py-2.5 text-sm text-danger">
          This link has expired or has already been used.
        </p>
        {mode === "reset" ? (
          <Link href="/admin/forgot-password" className="text-sm underline">
            Request a new reset link
          </Link>
        ) : (
          <p className="text-sm text-muted">Ask an admin to send you a new invitation.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
      {formError && (
        <p role="alert" className="rounded-lg border border-danger/40 px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </p>
      )}
      <FormField id="password" label="New password" required hint={PASSWORD_RULES} error={errors.password}>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          {...ariaFor("password", errors.password, true)}
          {...register("password")}
        />
      </FormField>
      <FormField id="confirm" label="Confirm password" required error={errors.confirm}>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          {...ariaFor("confirm", errors.confirm)}
          {...register("confirm")}
        />
      </FormField>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
      >
        {isSubmitting ? "Saving…" : mode === "reset" ? "Set new password" : "Create account"}
      </button>
    </form>
  );
}
