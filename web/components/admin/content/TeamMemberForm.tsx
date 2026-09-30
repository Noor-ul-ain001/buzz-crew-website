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
import type { TeamMember } from "@/lib/content/types";
import { altTextBlocker, teamDraftSchema, teamPublishSchema, type TeamFormValues } from "@/lib/content/validation";

const LIST_HREF = "/admin/content/team";

const EMPTY: TeamFormValues = { name: "", role: "", bio: "", photo: null };

export default function TeamMemberForm({ id }: { id?: string }) {
  const { items } = useContent("team");
  const existing = id ? items.find((item) => item.id === id) : undefined;

  if (id && !existing) return <ContentNotFound noun="team member" listHref={LIST_HREF} />;
  return <Editor key={id ?? "new"} existing={existing} />;
}

function toValues({ name, role, bio, photo }: TeamMember): TeamFormValues {
  return { name, role, bio, photo };
}

function Editor({ existing }: { existing: TeamMember | undefined }) {
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
  } = useForm<TeamFormValues>({
    defaultValues: existing ? toValues(existing) : EMPTY,
  });

  function showServerErrors(fields: Record<string, string>) {
    Object.entries(fields).forEach(([name, message], index) => {
      if (name in EMPTY) setError(name as Path<TeamFormValues>, { message }, { shouldFocus: index === 0 });
    });
  }

  const { pending, run, conflict, overwrite, review, dismissConflict } = usePublishFlow(
    "team",
    existing,
    LIST_HREF,
    showServerErrors,
  );
  const leaveGuard = useUnsavedChangesGuard(isDirty && pending === null);

  const [photo, bio] = useWatch({ control, name: ["photo", "bio"] });
  const publishBlocker = altTextBlocker([{ label: "photo", image: photo }]);

  function handleAction(action: PublishAction) {
    clearErrors();
    const schema = action === "publish" ? teamPublishSchema : teamDraftSchema;
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
        ← Team
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{existing ? "Edit team member" : "New team member"}</h1>
        {existing && <PublishBadge status={existing.status} />}
      </div>
      <p className="mt-1 text-sm text-muted">
        <span className="text-danger" aria-hidden="true">*</span> Required to publish. Drafts only need a name.
      </p>

      <form noValidate onSubmit={(event) => event.preventDefault()} className="mt-8 flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id={fieldId("name")} label="Name" required requiredText="required to publish" error={errors.name}>
            <input id={fieldId("name")} type="text" className={inputClass} {...ariaFor(fieldId("name"), errors.name)} {...register("name")} />
          </FormField>
          <FormField id={fieldId("role")} label="Role" required requiredText="required to publish" error={errors.role}>
            <input id={fieldId("role")} type="text" placeholder="Head of Social" className={inputClass} {...ariaFor(fieldId("role"), errors.role)} {...register("role")} />
          </FormField>
        </div>

        <FormField id={fieldId("bio")} label="Bio" required requiredText="required to publish" hint={`${bio.length}/300 characters. Two or three sentences work best.`} error={errors.bio}>
          <textarea id={fieldId("bio")} rows={5} maxLength={300} className={inputClass} {...ariaFor(fieldId("bio"), errors.bio, true)} {...register("bio")} />
        </FormField>

        <Controller
          control={control}
          name="photo"
          render={({ field }) => (
            <ImageField
              label="Photo"
              value={field.value}
              onChange={field.onChange}
              error={errors.photo?.message}
              altHint="Usually just the person’s name, e.g. “Sana Malik”."
            />
          )}
        />

        <div className="mt-2 border-t border-border pt-6">
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
