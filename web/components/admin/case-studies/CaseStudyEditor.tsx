"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import ImageField from "@/components/admin/content/ImageField";
import PublishActions, { type PublishAction } from "@/components/admin/content/PublishActions";
import PublishBadge from "@/components/admin/content/PublishBadge";
import { useUnsavedChangesGuard } from "@/components/admin/content/useUnsavedChangesGuard";
import FormField, { inputClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import MarkdownSection from "@/components/work/MarkdownSection";
import {
  CaseStudySaveError,
  EMPTY_CASE_STUDY,
  saveCaseStudy,
  suggestSlug,
  toFormValues,
  type CaseStudyAdmin,
  type CaseStudyFormValues,
} from "@/lib/content/case-study-admin";
import { COUNTRY_LABELS, INDUSTRIES, INDUSTRY_LABELS, SERVICE_LABELS, SERVICES_API } from "@/lib/content/work-labels";

const LIST_HREF = "/admin/content/case-studies";
const MAX_RESULTS = 6;
const MAX_HEADLINES = 3;
const MAX_IMAGES = 20;
const MAX_REELS = 5;

const SUCCESS: Record<PublishAction, string> = {
  draft: "Draft saved.",
  publish: "Published. It's live at /work.",
  unpublish: "Unpublished. It's now a draft and hidden from the site.",
};

// Server field keys → where the message shows in the form.
const FIELD_TARGETS: Record<string, string> = {
  "cover.alt_text": "cover",
  "results.headline": "results",
  "media[].alt_text": "media",
  "media[].description": "media",
  "media[]": "media",
  "results[]": "results",
  "before_after.alt_text": "before_after",
};

type Testimonial = { id: string; label: string };

function Section({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5 rounded-2xl border border-border p-5 sm:p-6">
      <h2 id={id} className="text-lg font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ErrorText({ message }: { message?: string }) {
  return message ? <p className="text-sm text-danger">{message}</p> : null;
}

export default function CaseStudyEditor({ initial, testimonials }: { initial: CaseStudyAdmin | null; testimonials: Testimonial[] }) {
  const formId = useId();
  const id = (name: string) => `${formId}-${name}`;
  const router = useRouter();
  const toast = useToast();
  const [saved, setSaved] = useState(initial);
  const [pending, setPending] = useState<PublishAction | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const {
    register,
    control,
    getValues,
    setValue,
    reset,
    formState: { isDirty },
  } = useForm<CaseStudyFormValues>({ defaultValues: initial ? toFormValues(initial) : EMPTY_CASE_STUDY });
  const results = useFieldArray({ control, name: "results" });
  const media = useFieldArray({ control, name: "media" });
  const values = useWatch({ control }) as CaseStudyFormValues;
  const leaveGuard = useUnsavedChangesGuard(isDirty && pending === null);

  const headlines = values.results.filter((r) => r.is_headline).length;
  const imageCount = values.media.filter((m) => m.kind === "image").length;
  const reelCount = values.media.length - imageCount;
  const uploading = [values.cover, values.before_image, values.after_image, ...values.media.map((m) => m.image)].some(
    (image) => image && !image.mediaId,
  );
  const error = (name: string) => serverErrors[name];

  async function run(action: PublishAction) {
    if (uploading) {
      toast("Wait for the images to finish uploading.", "error");
      return;
    }
    setPending(action);
    setServerErrors({});
    try {
      const existing = saved ? { id: saved.id, version: saved.version, status: saved.status } : null;
      const result = await saveCaseStudy(existing, getValues(), action);
      toast(SUCCESS[action]);
      reset(toFormValues(result));
      router.push(LIST_HREF);
      router.refresh();
    } catch (failure) {
      setPending(null);
      if (!(failure instanceof CaseStudySaveError)) {
        toast("Couldn't save your changes. Please try again.", "error");
        return;
      }
      if (failure.saved) {
        // Saved as a draft, but the publish checks failed.
        setSaved(failure.saved);
        if (!initial) router.replace(`${LIST_HREF}/${failure.saved.id}`);
      }
      if (failure.code === "version_conflict") {
        toast("Someone else changed this case study while you were editing. Reload to see their version.", "error");
        return;
      }
      const mapped = Object.fromEntries(Object.entries(failure.fields).map(([key, message]) => [FIELD_TARGETS[key] ?? key, message]));
      setServerErrors(mapped);
      toast(failure.saved ? "Saved as a draft. Fix the highlighted fields to publish." : failure.message, "error");
    }
  }

  const status = saved ? (saved.status === "published" ? "Published" : "Draft") : null;
  const text = (name: keyof CaseStudyFormValues, label: string, options: { max: number; hint?: string; required?: boolean; placeholder?: string }) => (
    <FormField id={id(name)} label={label} required={options.required} requiredText="required to publish" hint={options.hint} error={error(name) ? { type: "server", message: error(name) } : undefined}>
      <input id={id(name)} type="text" maxLength={options.max} placeholder={options.placeholder} className={inputClass} aria-invalid={error(name) ? true : undefined} {...register(name)} />
    </FormField>
  );
  const markdown = (name: "challenge_md" | "strategy_md" | "execution_md", label: string) => (
    <div className="grid gap-4 lg:grid-cols-2">
      <FormField id={id(name)} label={label} required requiredText="required to publish" hint="Markdown: **bold**, *italic*, lists, links and ## headings." error={error(name) ? { type: "server", message: error(name) } : undefined}>
        <textarea id={id(name)} rows={8} maxLength={10000} className={`${inputClass} font-mono`} {...register(name)} />
      </FormField>
      <div aria-label={`${label} preview`} className="rounded-xl bg-surface p-4">
        <MarkdownSection id={id(`${name}-preview`)} title="Preview" markdown={values[name] || "_Nothing written yet._"} />
      </div>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <Link href={LIST_HREF} className="text-sm font-medium text-muted hover:text-foreground">
        ← Case studies
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{saved ? "Edit case study" : "New case study"}</h1>
        {status && <PublishBadge status={status} />}
        {saved && (
          <Link href={`${LIST_HREF}/${saved.id}/preview`} className="ml-auto rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-surface">
            Preview
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">
        <span className="text-danger" aria-hidden="true">*</span> Required to publish. Drafts can be saved at any point.
      </p>

      <form noValidate onSubmit={(event) => event.preventDefault()} className="mt-8 flex flex-col gap-6">
        <Section title="Basics" id={id("basics")}>
          <div className="grid gap-5 sm:grid-cols-2">
            {text("client_name", "Client name", { max: 100, required: true, hint: "As it should appear publicly." })}
            {text("title", "Title", { max: 120, required: true })}
          </div>
          <div className="flex flex-col gap-2">
            {text("slug", "Web address", { max: 80, hint: "Lowercase words and hyphens: /work/your-address. Left empty, one is made for you." })}
            <button
              type="button"
              onClick={() => setValue("slug", suggestSlug(values.client_name, values.title), { shouldDirty: true })}
              className="self-start rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface"
            >
              Suggest from client and title
            </button>
          </div>
          {text("summary", "Summary", { max: 200, required: true, hint: `${values.summary.length}/200. Shown on cards and in search results.` })}
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField id={id("industry")} label="Industry" required requiredText="required to publish" error={error("industry") ? { type: "server", message: error("industry") } : undefined}>
              <select id={id("industry")} className={inputClass} {...register("industry")}>
                <option value="">Choose…</option>
                {INDUSTRIES.map((value) => (
                  <option key={value} value={value}>
                    {INDUSTRY_LABELS[value]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id={id("country")} label="Country" required requiredText="required to publish" error={error("country") ? { type: "server", message: error("country") } : undefined}>
              <select id={id("country")} className={inputClass} {...register("country")}>
                <option value="">Choose…</option>
                {Object.entries(COUNTRY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
            {text("project_period", "Project period (optional)", { max: 40, placeholder: "Jan–Jun 2026" })}
          </div>
          <fieldset>
            <legend className="text-sm font-medium">
              Services <span className="text-danger" aria-hidden="true">*</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {SERVICES_API.map((service) => (
                <label key={service} className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" value={service} {...register("services")} />
                  {SERVICE_LABELS[service]}
                </label>
              ))}
            </div>
            <ErrorText message={error("services")} />
          </fieldset>
          <Controller
            control={control}
            name="cover"
            render={({ field }) => <ImageField label="Cover image" value={field.value} onChange={field.onChange} error={error("cover")} previewShape="wide" />}
          />
        </Section>

        <Section title="The story" id={id("story")}>
          {markdown("challenge_md", "The challenge")}
          {markdown("strategy_md", "Our strategy")}
          {markdown("execution_md", "How we did it")}
        </Section>

        <Section title="Results" id={id("results")}>
          <p className="text-sm text-muted">1 to {MAX_RESULTS} results. Mark up to {MAX_HEADLINES} as headline; they show first and on cards.</p>
          <ErrorText message={error("results")} />
          <ol className="flex flex-col gap-4">
            {results.fields.map((field, index) => (
              <li key={field.id} className="grid gap-3 rounded-xl bg-surface p-4 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
                <FormField id={id(`r${index}-value`)} label="Value" error={undefined}>
                  <input id={id(`r${index}-value`)} maxLength={30} placeholder="+240%" className={inputClass} {...register(`results.${index}.value`)} />
                </FormField>
                <FormField id={id(`r${index}-label`)} label="What was measured" error={undefined}>
                  <input id={id(`r${index}-label`)} maxLength={80} placeholder="Instagram reach" className={inputClass} {...register(`results.${index}.label`)} />
                </FormField>
                <FormField id={id(`r${index}-period`)} label="Period" error={undefined}>
                  <input id={id(`r${index}-period`)} maxLength={40} placeholder="in 3 months" className={inputClass} {...register(`results.${index}.period`)} />
                </FormField>
                <FormField id={id(`r${index}-start`)} label="Starting value (optional)" error={undefined}>
                  <input id={id(`r${index}-start`)} maxLength={30} className={inputClass} {...register(`results.${index}.starting_value`)} />
                </FormField>
                <div className="flex items-end gap-3 sm:flex-col sm:items-start">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      disabled={!values.results[index]?.is_headline && headlines >= MAX_HEADLINES}
                      {...register(`results.${index}.is_headline`)}
                    />
                    Headline
                  </label>
                  <button type="button" onClick={() => results.remove(index)} className="text-sm font-medium text-danger">
                    Remove<span className="sr-only"> result {index + 1}</span>
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <button
            type="button"
            disabled={results.fields.length >= MAX_RESULTS}
            onClick={() => results.append({ value: "", label: "", period: "", starting_value: "", is_headline: results.fields.length === 0 })}
            className="self-start rounded-full border border-foreground px-4 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-50"
          >
            Add a result
          </button>
        </Section>

        <Section title="Images and reels" id={id("media")}>
          <p className="text-sm text-muted">
            Up to {MAX_IMAGES} images and {MAX_REELS} reels. Reels load from YouTube, Vimeo or Instagram only when a visitor presses Play.
          </p>
          <ErrorText message={error("media")} />
          <ol className="flex flex-col gap-4">
            {media.fields.map((field, index) => (
              <li key={field.id} className="flex flex-col gap-3 rounded-xl bg-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{field.kind === "reel" ? `Reel ${index + 1}` : `Image ${index + 1}`}</p>
                  <button type="button" onClick={() => media.remove(index)} className="text-sm font-medium text-danger">
                    Remove<span className="sr-only"> item {index + 1}</span>
                  </button>
                </div>
                <Controller
                  control={control}
                  name={`media.${index}.image`}
                  render={({ field: image }) => (
                    <ImageField label={field.kind === "reel" ? "Preview image" : "Image"} value={image.value} onChange={image.onChange} />
                  )}
                />
                {field.kind === "reel" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField id={id(`m${index}-url`)} label="Reel link" error={undefined}>
                      <input id={id(`m${index}-url`)} type="url" placeholder="https://www.instagram.com/reel/…" className={inputClass} {...register(`media.${index}.video_url`)} />
                    </FormField>
                    <FormField id={id(`m${index}-description`)} label="What happens in the reel" required requiredText="required to publish" error={undefined}>
                      <input id={id(`m${index}-description`)} maxLength={200} className={inputClass} {...register(`media.${index}.description`)} />
                    </FormField>
                  </div>
                )}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={imageCount >= MAX_IMAGES}
              onClick={() => media.append({ kind: "image", image: null, video_url: "", description: "" })}
              className="rounded-full border border-foreground px-4 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-50"
            >
              Add an image
            </button>
            <button
              type="button"
              disabled={reelCount >= MAX_REELS}
              onClick={() => media.append({ kind: "reel", image: null, video_url: "", description: "" })}
              className="rounded-full border border-foreground px-4 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-50"
            >
              Add a reel
            </button>
          </div>
        </Section>

        <Section title="Before and after (optional)" id={id("before-after")}>
          <p className="text-sm text-muted">Add both images or neither. Visitors compare them with a slider.</p>
          <ErrorText message={error("before_after")} />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              {text("before_label", "Before label", { max: 30 })}
              <Controller control={control} name="before_image" render={({ field }) => <ImageField label="Before image" value={field.value} onChange={field.onChange} previewShape="wide" />} />
            </div>
            <div className="flex flex-col gap-3">
              {text("after_label", "After label", { max: 30 })}
              <Controller control={control} name="after_image" render={({ field }) => <ImageField label="After image" value={field.value} onChange={field.onChange} previewShape="wide" />} />
            </div>
          </div>
        </Section>

        <Section title="Testimonial and search (optional)" id={id("extras")}>
          <FormField id={id("testimonial")} label="Client quote" hint="Shown only while that testimonial is published." error={undefined}>
            <select id={id("testimonial")} className={inputClass} {...register("testimonial_id")}>
              <option value="">No quote</option>
              {testimonials.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            {text("seo_title", "Search title", { max: 60, hint: `${values.seo_title.length}/60. Defaults to the title.` })}
            {text("seo_description", "Search description", { max: 160, hint: `${values.seo_description.length}/160. Defaults to the summary.` })}
          </div>
        </Section>

        <div className="border-t border-border pt-6">
          <PublishActions
            status={status}
            pending={pending}
            publishBlocker={uploading ? "Wait for the images to finish uploading." : null}
            onAction={run}
          />
        </div>
      </form>
      {leaveGuard}
    </main>
  );
}
