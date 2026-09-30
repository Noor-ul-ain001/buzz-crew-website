import type { ReactNode } from "react";
import type { FieldError, FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ZodSafeParseResult } from "zod";

export const inputClass =
  "block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground " +
  "placeholder:text-muted/80 aria-[invalid=true]:border-danger";

export function ariaFor(id: string, error: FieldError | undefined, hint = false) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ");
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  };
}

/** Copies zod issues onto react-hook-form fields and focuses the first invalid one. */
export function applyIssues<T extends FieldValues>(result: ZodSafeParseResult<unknown>, setError: UseFormSetError<T>) {
  if (result.success) return;
  result.error.issues.forEach((issue, index) => {
    const field = issue.path[0];
    if (typeof field === "string") {
      setError(field as Path<T>, { message: issue.message }, { shouldFocus: index === 0 });
    }
  });
}

// `requiredText` is read out after the label, e.g. "required to publish" in the admin,
// where drafts can be saved without those fields.
export default function FormField({
  id,
  label,
  required = false,
  requiredText = "required",
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  requiredText?: string;
  hint?: string;
  error: FieldError | undefined;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <>
            {" "}
            <span className="text-danger" aria-hidden="true">
              *
            </span>
            <span className="sr-only">({requiredText})</span>
          </>
        )}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error?.message && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error.message}
        </p>
      )}
    </div>
  );
}
