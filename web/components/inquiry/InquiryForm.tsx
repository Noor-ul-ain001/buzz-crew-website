"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type BaseSyntheticEvent, type ReactNode } from "react";
import { useForm, type FieldError, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { currentSourcePage, track } from "@/lib/analytics";
import { submitInquiry } from "@/lib/leads/submit";
import { CONTACT_EMAIL } from "@/lib/site";
import {
  BUDGETS,
  COUNTRIES,
  EMPTY_INQUIRY,
  SERVICES,
  inquirySchema,
  type InquiryData,
  type InquiryFormValues,
} from "@/lib/validation/inquiry";

const inputClass =
  "block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-base text-foreground " +
  "placeholder:text-muted/80 aria-[invalid=true]:border-danger";

type Status =
  | { kind: "idle" }
  | { kind: "success" }
  | { kind: "error" }
  | { kind: "rate_limited"; message: string };

type InquiryFormProps = {
  /** Pre-fills the form, e.g. the chat assistant passes a conversation summary as the message. */
  initialValues?: Partial<InquiryFormValues>;
  /** Called on every change so a closed modal can restore the values when reopened. */
  onDraftChange?: (values: Partial<InquiryFormValues>) => void;
  /** Called once the lead is stored (e.g. to clear a saved draft). */
  onSubmitted?: () => void;
};

export default function InquiryForm({ initialValues, onDraftChange, onSubmitted }: InquiryFormProps = {}) {
  const id = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // One key per form instance: a double tap or a retry after a timeout never creates two leads.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    subscribe,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormValues, unknown, InquiryData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { ...EMPTY_INQUIRY, ...initialValues },
    mode: "onTouched",
    shouldFocusError: true,
  });

  useEffect(() => {
    if (!onDraftChange) return;
    return subscribe({
      formState: { values: true },
      callback: ({ values }) => onDraftChange(values),
    });
  }, [subscribe, onDraftChange]);

  useEffect(() => {
    if (status.kind === "success") successHeadingRef.current?.focus();
  }, [status]);

  const submit = async (data: InquiryData) => {
    setStatus({ kind: "idle" });
    const sourcePage = currentSourcePage();
    const result = await submitInquiry(data, {
      idempotencyKey,
      sourcePage,
      honeypot: honeypotRef.current?.value ?? "",
    });

    switch (result.kind) {
      case "created":
        track("inquiry_submitted", { source_page: sourcePage });
        setStatus({ kind: "success" });
        onSubmitted?.();
        return;
      case "invalid": {
        const fields = Object.entries(result.fieldErrors) as [FieldPath<InquiryFormValues>, string][];
        for (const [field, message] of fields) setError(field, { type: "server", message });
        if (fields[0]) setFocus(fields[0][0]);
        return;
      }
      case "rate_limited":
        setStatus({ kind: "rate_limited", message: result.message });
        return;
      default:
        setStatus({ kind: "error" });
    }
  };
  // Built inside event handlers (not during render) because `submit` reads refs.
  const onSubmit = (event?: BaseSyntheticEvent) => handleSubmit(submit)(event);

  if (status.kind === "success") {
    return (
      <div className="flex flex-col items-start gap-4 py-6" role="status">
        <h2
          ref={successHeadingRef}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight outline-none"
        >
          Thanks! The crew will get back to you within 24 hours.
        </h2>
        <p className="text-muted">
          We&apos;ve emailed you a copy of your request. Anything to add? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            reset(EMPTY_INQUIRY);
            setIdempotencyKey(crypto.randomUUID());
            setStatus({ kind: "idle" });
          }}
          className="rounded-full border border-border px-5 py-3 font-medium hover:bg-surface"
        >
          Send another inquiry
        </button>
      </div>
    );
  }

  const fieldId = (name: string) => `${id}-${name}`;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it in. */}
      <div aria-hidden="true" className="hidden">
        <label>
          Website
          <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={fieldId("name")} label="Name" required error={errors.name}>
          <input
            id={fieldId("name")}
            type="text"
            autoComplete="name"
            className={inputClass}
            {...ariaFor(fieldId("name"), errors.name)}
            {...register("name")}
          />
        </Field>

        <Field id={fieldId("email")} label="Email" required error={errors.email}>
          <input
            id={fieldId("email")}
            type="email"
            autoComplete="email"
            inputMode="email"
            className={inputClass}
            {...ariaFor(fieldId("email"), errors.email)}
            {...register("email")}
          />
        </Field>

        <Field id={fieldId("phone")} label="Phone" error={errors.phone}>
          <input
            id={fieldId("phone")}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+92 300 1234567"
            className={inputClass}
            {...ariaFor(fieldId("phone"), errors.phone)}
            {...register("phone")}
          />
        </Field>

        <Field id={fieldId("businessName")} label="Business name" error={errors.businessName}>
          <input
            id={fieldId("businessName")}
            type="text"
            autoComplete="organization"
            className={inputClass}
            {...ariaFor(fieldId("businessName"), errors.businessName)}
            {...register("businessName")}
          />
        </Field>

        <Field id={fieldId("country")} label="Country" required error={errors.country}>
          <select
            id={fieldId("country")}
            className={inputClass}
            {...ariaFor(fieldId("country"), errors.country)}
            {...register("country")}
          >
            <option value="">Select a country</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </Field>

        <Field id={fieldId("budget")} label="Monthly budget" required error={errors.budget}>
          <select
            id={fieldId("budget")}
            className={inputClass}
            {...ariaFor(fieldId("budget"), errors.budget)}
            {...register("budget")}
          >
            <option value="">Select a budget</option>
            {BUDGETS.map((budget) => (
              <option key={budget} value={budget}>
                {budget}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset aria-describedby={errors.services ? fieldId("services-error") : undefined}>
        <legend className="mb-2 text-sm font-medium">
          Services you&apos;re interested in{" "}
          <span className="text-danger" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(required, choose at least one)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((service) => (
            <label
              key={service}
              className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-medium select-none hover:bg-surface has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foreground"
            >
              <input
                type="checkbox"
                value={service}
                className="sr-only"
                aria-invalid={errors.services ? true : undefined}
                {...register("services")}
              />
              {service}
            </label>
          ))}
        </div>
        {errors.services?.message && (
          <p id={fieldId("services-error")} className="mt-1.5 text-sm text-danger">
            {errors.services.message}
          </p>
        )}
      </fieldset>

      <Field id={fieldId("message")} label="Tell us about your project" required error={errors.message}>
        <textarea
          id={fieldId("message")}
          rows={5}
          maxLength={2000}
          placeholder="What are you working on, and what would you like the crew to help with?"
          className={inputClass}
          {...ariaFor(fieldId("message"), errors.message)}
          {...register("message")}
        />
      </Field>

      <div aria-live="assertive">
        {status.kind === "error" && (
          <Alert
            action={
              <button
                type="button"
                onClick={() => onSubmit()}
                disabled={isSubmitting}
                className="shrink-0 rounded-full border border-border bg-background px-4 py-2 font-medium hover:bg-surface disabled:opacity-60"
              >
                Retry
              </button>
            }
          >
            Sorry, we couldn&apos;t send your message. Please try again or email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline">
              {CONTACT_EMAIL}
            </a>
            .
          </Alert>
        )}
        {status.kind === "rate_limited" && (
          <Alert>
            {status.message} You can also email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline">
              {CONTACT_EMAIL}
            </a>
            .
          </Alert>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-foreground hover:brightness-95 disabled:cursor-wait disabled:opacity-70 sm:self-start"
        >
          {isSubmitting && (
            <span
              aria-hidden="true"
              className="size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
            />
          )}
          {isSubmitting ? "Sending…" : "Send inquiry"}
        </button>
        <p className="text-xs text-muted">
          By sending this form you agree to our{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          . We only use your details to reply to your inquiry.
        </p>
      </div>
    </form>
  );
}


function Alert({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-danger/40 bg-danger/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{children}</p>
      {action}
    </div>
  );
}

function ariaFor(fieldId: string, error: FieldError | undefined) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${fieldId}-error` : undefined,
  };
}

function Field({
  id,
  label,
  required = false,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error: FieldError | undefined;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}{" "}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="font-normal text-muted">(optional)</span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </label>
      {children}
      {error?.message && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error.message}
        </p>
      )}
    </div>
  );
}
