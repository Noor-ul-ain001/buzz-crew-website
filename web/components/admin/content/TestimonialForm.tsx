"use client";

import Link from "next/link";
import { useId } from "react";
import type { Path } from "react-hook-form";
import { Controller, useForm, useWatch } from "react-hook-form";
import ContentNotFound from "@/components/admin/content/ContentNotFound";
import { useContent } from "@/components/admin/content/ContentProvider";
import FormField, { applyIssues, ariaFor, inputClass } from "@/components/ui/FormField";
import ImageField from "@/components/admin/content/ImageField";
import PublishActions, { type PublishAction } from "@/components/admin/content/PublishActions";
import PublishBadge from "@/components/admin/content/PublishBadge";
import { useUnsavedChangesGuard } from "@/components/admin/content/useUnsavedChangesGuard";
import { usePublishFlow } from "@/components/admin/content/usePublishFlow";
import VersionConflictDialog from "@/components/admin/content/VersionConflictDialog";
import TestimonialCard from "@/components/home/TestimonialCard";
import type { Testimonial } from "@/lib/content/types";
import {
  altTextBlocker,
  testimonialDraftSchema,
  testimonialPublishSchema,
  type TestimonialFormValues,
} from "@/lib/content/validation";
import { COUNTRIES } from "@/lib/validation/inquiry";

const LIST_HREF = "/admin/content/testimonials";

const EMPTY: TestimonialFormValues = {
  name: "",
  role: "",
  company: "",
  country: "",
  quote: "",
  photo: null,
  videoUrl: "",
};

export default function TestimonialForm({ id }: { id?: string }) {
  const { items } = useContent("testimonials");
  const existing = id ? items.find((item) => item.id === id) : undefined;

  if (id && !existing) return <ContentNotFound noun="testimonial" listHref={LIST_HREF} />;
  // Keyed so the form resets if the admin moves between items.
  return <Editor key={id ?? "new"} existing={existing} />;
}

function toValues(item: Testimonial): TestimonialFormValues {
  const { name, role, company, country, quote, photo, videoUrl } = item;
  return { name, role, company, country, quote, photo, videoUrl };
}

function Editor({ existing }: { existing: Testimonial | undefined }) {
  const formId = useId();
  const fieldId = (name: string) => `${formId}-${name}`;

  const {
    register,
    control,
    getValues,
    setError,
    clearErrors,
    reset,
    formState: { errors, isDirty },
  } = useForm<TestimonialFormValues>({
    defaultValues: existing ? toValues(existing) : EMPTY,
  });

  function showServerErrors(fields: Record<string, string>) {
    Object.entries(fields).forEach(([name, message], index) => {
      if (name in EMPTY) setError(name as Path<TestimonialFormValues>, { message }, { shouldFocus: index === 0 });
    });
  }

  const { pending, run, conflict, overwrite, review, dismissConflict } = usePublishFlow(
    "testimonials",
    existing,
    LIST_HREF,
    showServerErrors,
  );
  const leaveGuard = useUnsavedChangesGuard(isDirty && pending === null);

  // Every field has a default, so the watched values are complete.
  const values = useWatch({ control }) as TestimonialFormValues;
  const publishBlocker = altTextBlocker([{ label: "photo", image: values.photo }]);

  function handleAction(action: PublishAction) {
    clearErrors();
    const schema = action === "publish" ? testimonialPublishSchema : testimonialDraftSchema;
    const result = schema.safeParse(getValues());
    if (!result.success) {
      applyIssues(result, setError);
      return;
    }
    run(action, result.data);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <Link href={LIST_HREF} className="text-sm font-medium text-muted hover:text-foreground">
        ← Testimonials
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{existing ? "Edit testimonial" : "New testimonial"}</h1>
        {existing && <PublishBadge status={existing.status} />}
      </div>
      <p className="mt-1 text-sm text-muted">
        <span className="text-danger" aria-hidden="true">*</span> Required to publish. Drafts only need a name.
      </p>

      <form
        noValidate
        onSubmit={(event) => event.preventDefault()}
        className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]"
      >
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id={fieldId("name")} label="Name" required requiredText="required to publish" error={errors.name}>
              <input id={fieldId("name")} type="text" className={inputClass} {...ariaFor(fieldId("name"), errors.name)} {...register("name")} />
            </FormField>
            <FormField id={fieldId("role")} label="Role" required requiredText="required to publish" error={errors.role}>
              <input id={fieldId("role")} type="text" placeholder="Founder" className={inputClass} {...ariaFor(fieldId("role"), errors.role)} {...register("role")} />
            </FormField>
            <FormField id={fieldId("company")} label="Company" required requiredText="required to publish" error={errors.company}>
              <input id={fieldId("company")} type="text" className={inputClass} {...ariaFor(fieldId("company"), errors.company)} {...register("company")} />
            </FormField>
            <FormField id={fieldId("country")} label="Country" required requiredText="required to publish" error={errors.country}>
              <select id={fieldId("country")} className={inputClass} {...ariaFor(fieldId("country"), errors.country)} {...register("country")}>
                <option value="">Select a country</option>
                {COUNTRIES.map((country) => (
                  <option key={country}>{country}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField id={fieldId("quote")} label="Quote" required requiredText="required to publish" hint={`${values.quote.length}/400 characters, at least 20`} error={errors.quote}>
            <textarea
              id={fieldId("quote")}
              rows={5}
              maxLength={400}
              className={inputClass}
              {...ariaFor(fieldId("quote"), errors.quote, true)}
              {...register("quote")}
            />
          </FormField>

          <Controller
            control={control}
            name="photo"
            render={({ field }) => (
              <ImageField label="Photo" value={field.value} onChange={field.onChange} error={errors.photo?.message} />
            )}
          />

          <FormField
            id={fieldId("videoUrl")}
            label="Video URL (optional)"
            hint="A YouTube, Instagram or Vimeo link to a video version of this testimonial."
            error={errors.videoUrl}
          >
            <input
              id={fieldId("videoUrl")}
              type="url"
              inputMode="url"
              placeholder="https://"
              className={inputClass}
              {...ariaFor(fieldId("videoUrl"), errors.videoUrl, true)}
              {...register("videoUrl")}
            />
          </FormField>
        </div>

        <aside aria-labelledby={fieldId("preview")} className="lg:sticky lg:top-8 lg:self-start">
          <h2 id={fieldId("preview")} className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Preview
          </h2>
          <div className="rounded-3xl bg-surface p-3">
            <TestimonialCard testimonial={values} />
          </div>
        </aside>

        <div className="border-t border-border pt-6 lg:col-span-2">
          <PublishActions status={existing?.status ?? null} pending={pending} publishBlocker={publishBlocker} onAction={handleAction} />
        </div>
      </form>
      <VersionConflictDialog
        conflict={conflict}
        onClose={dismissConflict}
        onOverwrite={overwrite}
        onReview={() => {
          const current = review();
          if (current) reset(toValues(current));
        }}
      />
      {leaveGuard}
    </main>
  );
}
