"use client";

import Link from "next/link";
import { useId } from "react";
import type { Path } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import ContentNotFound from "@/components/admin/content/ContentNotFound";
import { useContent } from "@/components/admin/content/ContentProvider";
import PublishActions, { type PublishAction } from "@/components/admin/content/PublishActions";
import PublishBadge from "@/components/admin/content/PublishBadge";
import { useUnsavedChangesGuard } from "@/components/admin/content/useUnsavedChangesGuard";
import { usePublishFlow } from "@/components/admin/content/usePublishFlow";
import VersionConflictDialog from "@/components/admin/content/VersionConflictDialog";
import FormField, { applyIssues, ariaFor, inputClass } from "@/components/ui/FormField";
import { FAQ_GROUPS, type FaqItem } from "@/lib/content/types";
import { faqDraftSchema, faqPublishSchema, type FaqFormValues } from "@/lib/content/validation";

const LIST_HREF = "/admin/content/faqs";

const EMPTY: FaqFormValues = { group: FAQ_GROUPS[0], question: "", answer: "" };

export default function FaqForm({ id }: { id?: string }) {
  const { items } = useContent("faqs");
  const existing = id ? items.find((item) => item.id === id) : undefined;

  if (id && !existing) return <ContentNotFound noun="FAQ" listHref={LIST_HREF} />;
  return <Editor key={id ?? "new"} existing={existing} />;
}

function toValues({ group, question, answer }: FaqItem): FaqFormValues {
  return { group, question, answer };
}

function Editor({ existing }: { existing: FaqItem | undefined }) {
  const formId = useId();
  const fieldId = (name: string) => `${formId}-${name}`;
  const { items } = useContent("faqs");
  // The standard groups, plus any others already in use.
  const groups = [...new Set<string>([...FAQ_GROUPS, ...items.map((item) => item.group).filter(Boolean)])];

  const {
    register,
    control,
    getValues,
    setError,
    clearErrors,
    reset,
    formState: { errors, isDirty },
  } = useForm<FaqFormValues>({ defaultValues: existing ? toValues(existing) : EMPTY });

  function showServerErrors(fields: Record<string, string>) {
    Object.entries(fields).forEach(([name, message], index) => {
      if (name in EMPTY) setError(name as Path<FaqFormValues>, { message }, { shouldFocus: index === 0 });
    });
  }

  const { pending, run, conflict, overwrite, review, dismissConflict } = usePublishFlow("faqs", existing, LIST_HREF, showServerErrors);
  const leaveGuard = useUnsavedChangesGuard(isDirty && pending === null);
  const answer = useWatch({ control, name: "answer" });

  function handleAction(action: PublishAction) {
    clearErrors();
    const schema = action === "publish" ? faqPublishSchema : faqDraftSchema;
    const result = schema.safeParse(getValues());
    if (!result.success) {
      applyIssues(result, setError);
      return;
    }
    run(action, result.data);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <Link href={LIST_HREF} className="text-sm font-medium text-muted hover:text-foreground">
        ← FAQs
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{existing ? "Edit FAQ" : "New FAQ"}</h1>
        {existing && <PublishBadge status={existing.status} />}
      </div>
      <p className="mt-1 text-sm text-muted">
        <span className="text-danger" aria-hidden="true">*</span> Required to publish. Drafts only need the question.
      </p>

      <form noValidate onSubmit={(event) => event.preventDefault()} className="mt-8 flex flex-col gap-5">
        <FormField id={fieldId("group")} label="Group" required requiredText="required to publish" hint="Where it appears on the FAQ page." error={errors.group}>
          <input
            id={fieldId("group")}
            type="text"
            list={fieldId("groups")}
            className={inputClass}
            {...ariaFor(fieldId("group"), errors.group, true)}
            {...register("group")}
          />
        </FormField>
        <datalist id={fieldId("groups")}>
          {groups.map((group) => (
            <option key={group} value={group} />
          ))}
        </datalist>

        <FormField id={fieldId("question")} label="Question" required error={errors.question}>
          <input id={fieldId("question")} type="text" className={inputClass} {...ariaFor(fieldId("question"), errors.question)} {...register("question")} />
        </FormField>

        <FormField
          id={fieldId("answer")}
          label="Answer"
          required
          requiredText="required to publish"
          hint={`${answer.length}/2000 characters. Plain sentences; keep it short and specific.`}
          error={errors.answer}
        >
          <textarea id={fieldId("answer")} rows={6} maxLength={2000} className={inputClass} {...ariaFor(fieldId("answer"), errors.answer, true)} {...register("answer")} />
        </FormField>

        <div className="mt-2 border-t border-border pt-6">
          <PublishActions status={existing?.status ?? null} pending={pending} publishBlocker={null} onAction={handleAction} />
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
