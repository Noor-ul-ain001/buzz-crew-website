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
import { PASSWORD_RULES } from "@/lib/auth/types";

const schema = z
  .object({
    name: z.string().trim().min(1, "Enter your name.").max(100, "Keep your name under 100 characters."),
    email: z.email("Enter your work email."),
    password: z.string().min(12, "Use at least 12 characters.").max(128, "Use 128 characters or fewer."),
    confirm: z.string().min(1, "Enter the password again."),
    code: z.string().trim().min(1, "Enter the sign-up code from an admin.").max(128),
  })
  .refine((values) => values.password === values.confirm, { path: ["confirm"], message: "The passwords don't match." });
type Values = z.infer<typeof schema>;

// Staff sign-up, gated by the shared code the API checks. New accounts are editors;
// an admin can change the role from the Team page.
export default function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ name, email, password, code }) => {
    setFormError(null);
    const { data, error } = await api.POST("/api/v1/auth/signup", { body: { name, email, password, code } });
    if (!data) {
      setFormError(errorMessage(error));
      return;
    }
    router.replace("/admin");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
      {formError && (
        <p role="alert" className="rounded-lg border border-danger/40 px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </p>
      )}
      <FormField id="name" label="Full name" required error={errors.name}>
        <input id="name" type="text" autoComplete="name" className={inputClass} {...ariaFor("name", errors.name)} {...register("name")} />
      </FormField>
      <FormField id="email" label="Work email" required error={errors.email}>
        <input id="email" type="email" autoComplete="username" className={inputClass} {...ariaFor("email", errors.email)} {...register("email")} />
      </FormField>
      <FormField id="password" label="Password" hint={PASSWORD_RULES} required error={errors.password}>
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
        <input id="confirm" type="password" autoComplete="new-password" className={inputClass} {...ariaFor("confirm", errors.confirm)} {...register("confirm")} />
      </FormField>
      <FormField id="code" label="Staff sign-up code" hint="Ask an existing admin for the current code." required error={errors.code}>
        <input
          id="code"
          type="password"
          autoComplete="off"
          className={inputClass}
          {...ariaFor("code", errors.code, true)}
          {...register("code")}
        />
      </FormField>
      <button
        type="submit"
        disabled={isSubmitting}
        className="press rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/admin/login" className="font-medium text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
