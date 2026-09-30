"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FormField, { ariaFor, inputClass } from "@/components/ui/FormField";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/auth/errors";

const schema = z.object({
  email: z.email("Enter your work email."),
  password: z.string().min(1, "Enter your password.").max(128),
});
type Values = z.infer<typeof schema>;

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const { data, error } = await api.POST("/api/v1/auth/login", { body: values });
    if (!data) {
      setFormError(errorMessage(error));
      return;
    }
    router.replace(next);
    router.refresh();
  });

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
      <FormField id="password" label="Password" required error={errors.password}>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          {...ariaFor("password", errors.password)}
          {...register("password")}
        />
      </FormField>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
      <Link href="/admin/forgot-password" className="text-center text-sm text-muted underline hover:text-foreground">
        Forgot your password?
      </Link>
      <p className="text-center text-sm text-muted">
        New to the team?{" "}
        <Link href="/admin/signup" className="font-medium text-foreground underline underline-offset-4">
          Create a staff account
        </Link>
      </p>
    </form>
  );
}
