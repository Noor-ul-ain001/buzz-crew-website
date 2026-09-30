"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FormField, { ariaFor, inputClass } from "@/components/ui/FormField";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/auth/errors";

const schema = z.object({ email: z.email("Enter your work email.") });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const { data, error } = await api.POST("/api/v1/auth/password-reset/request", { body: values });
    if (data) setSent(data.message);
    else setFormError(errorMessage(error));
  });

  if (sent) {
    return (
      <div className="mt-6 flex flex-col gap-4">
        <p role="status" className="rounded-lg bg-background px-3.5 py-2.5 text-sm">
          {sent} The link works once and expires in 1 hour.
        </p>
        <Link href="/admin/login" className="text-sm underline">
          Back to sign in
        </Link>
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
      <FormField id="email" label="Email" required error={errors.email}>
        <input
          id="email"
          type="email"
          autoComplete="username"
          className={inputClass}
          {...ariaFor("email", errors.email)}
          {...register("email")}
        />
      </FormField>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
      >
        {isSubmitting ? "Sending…" : "Send reset link"}
      </button>
      <Link href="/admin/login" className="text-center text-sm text-muted underline hover:text-foreground">
        Back to sign in
      </Link>
    </form>
  );
}
