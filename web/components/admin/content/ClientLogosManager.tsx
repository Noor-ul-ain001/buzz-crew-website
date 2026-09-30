"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useContent } from "@/components/admin/content/ContentProvider";
import FormField, { applyIssues, ariaFor, inputClass } from "@/components/ui/FormField";
import ImageField from "@/components/admin/content/ImageField";
import SortableList from "@/components/admin/content/SortableList";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import Tooltip from "@/components/ui/Tooltip";
import { ContentApiError, VersionConflictError, publishContent, saveContent } from "@/lib/content/admin-api";
import type { ClientLogo } from "@/lib/content/types";
import { altTextBlocker, clientLogoSchema, type ClientLogoFormValues } from "@/lib/content/validation";

/** Why this logo can't be published, or null if it can. */
function logoBlocker(logo: ClientLogo["logo"]): string | null {
  if (!logo) return "Upload a logo before publishing.";
  return altTextBlocker([{ label: "logo", image: logo }]);
}

export default function ClientLogosManager() {
  const { items, upsert, remove, reorder } = useContent("logos");
  const toast = useToast();
  // The button that opened the modal, to get focus back when it closes.
  const openerRef = useRef<HTMLElement | null>(null);
  // null: closed; "new": adding; otherwise the logo being edited.
  const [editing, setEditing] = useState<ClientLogo | "new" | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [removing, setRemoving] = useState<ClientLogo | null>(null);
  const [busyRemoving, setBusyRemoving] = useState(false);

  async function handleReorder(ids: string[]) {
    try {
      await reorder(ids);
      toast("New order saved.");
    } catch {
      toast("Couldn't save the new order, so it's been put back.", "error");
    }
  }

  async function togglePublished(item: ClientLogo) {
    const publish = item.status !== "Published";
    setToggling(item.id);
    try {
      upsert(await publishContent("logos", item.id, publish));
      toast(publish ? `${item.name} is published.` : `${item.name} is hidden from the site.`);
    } catch (error) {
      toast(error instanceof ContentApiError ? error.message : `Couldn't update ${item.name}. Please try again.`, "error");
    } finally {
      setToggling(null);
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    setBusyRemoving(true);
    try {
      await remove(removing.id);
      toast(`${removing.name} was removed.`);
      setRemoving(null);
    } catch {
      toast(`Couldn't remove ${removing.name}. Please try again.`, "error");
    } finally {
      setBusyRemoving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <Link href="/admin/content" className="text-sm font-medium text-muted hover:text-foreground">
        ← Content
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client logos</h1>
          <p className="mt-1 text-muted">
            Published logos scroll across the homepage in this order. Drag the handle to reorder.
          </p>
        </div>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={(event) => {
            openerRef.current = event.currentTarget;
            setEditing("new");
          }}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:brightness-95"
        >
          Add logo
        </button>
      </div>

      <SortableList
        items={items}
        layout="grid"
        getLabel={(item) => item.name}
        onReorder={handleReorder}
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        renderItem={(item, handle) => {
          const blocker = item.status === "Draft" ? logoBlocker(item.logo) : null;
          const published = item.status === "Published";
          const busy = toggling === item.id;
          return (
            <div className="flex h-full flex-col rounded-2xl border border-border bg-background">
              <div className="flex h-28 items-center justify-center rounded-t-2xl bg-surface p-4">
                {item.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.logo.url} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-sm text-muted">No logo uploaded</span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start gap-2">
                  {handle}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="truncate text-sm text-muted">{item.websiteUrl.replace(/^https:\/\//, "") || "No website"}</p>
                    {item.logo && !item.logo.alt.trim() && (
                      <p className="text-xs font-medium text-danger">Logo needs alt text</p>
                    )}
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <Tooltip content={blocker}>
                    {(describedBy) => (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={published}
                        aria-disabled={blocker || busy ? true : undefined}
                        aria-describedby={describedBy}
                        onClick={() => {
                          if (!blocker && !busy) togglePublished(item);
                        }}
                        className="group inline-flex items-center gap-2 rounded-full py-1 pr-2 text-sm font-medium aria-disabled:cursor-not-allowed"
                      >
                        <span
                          aria-hidden="true"
                          className={`relative h-6 w-10 rounded-full transition-colors group-aria-disabled:opacity-50 ${
                            published ? "bg-emerald-600 dark:bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 size-4 rounded-full bg-white shadow transition-transform ${
                              published ? "translate-x-4" : ""
                            }`}
                          />
                        </span>
                        {busy ? "Saving…" : "Published"}
                        <span className="sr-only"> {item.name}</span>
                      </button>
                    )}
                  </Tooltip>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      onClick={(event) => {
                        openerRef.current = event.currentTarget;
                        setEditing(item);
                      }}
                      className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-surface"
                    >
                      Edit<span className="sr-only"> {item.name}</span>
                    </button>
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      onClick={(event) => {
                        openerRef.current = event.currentTarget;
                        setRemoving(item);
                      }}
                      className="rounded-full px-3 py-1.5 text-sm font-medium text-danger hover:bg-surface"
                    >
                      Remove<span className="sr-only"> {item.name}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      />

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add a client logo" : "Edit client logo"}
        description={editing === "new" ? "New logos are saved as drafts. Publish them from the grid." : undefined}
        returnFocusRef={openerRef}
      >
        {editing !== null && (
          <LogoForm
            key={editing === "new" ? "new" : editing.id}
            existing={editing === "new" ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={removing ? `Remove ${removing.name}?` : "Remove logo?"}
        description="The logo disappears from the site and its image is deleted. This can't be undone."
        returnFocusRef={openerRef}
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setRemoving(null)}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={confirmRemove}
            disabled={busyRemoving}
            className="rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busyRemoving ? "Removing…" : "Remove logo"}
          </button>
        </div>
      </Modal>
    </main>
  );
}

function LogoForm({ existing, onDone }: { existing: ClientLogo | undefined; onDone: () => void }) {
  const { upsert } = useContent("logos");
  const toast = useToast();
  const formId = useId();
  const fieldId = (name: string) => `${formId}-${name}`;
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ClientLogoFormValues>({
    defaultValues: existing
      ? { name: existing.name, logo: existing.logo, websiteUrl: existing.websiteUrl }
      : { name: "", logo: null, websiteUrl: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    clearErrors();
    const result = clientLogoSchema.safeParse(values);
    if (!result.success) {
      applyIssues(result, setError);
      return;
    }
    if (result.data.logo && !result.data.logo.mediaId && result.data.logo.url.startsWith("blob:")) {
      setError("logo", { message: "Wait for the logo to finish uploading." });
      return;
    }
    // Published logos stay published only if they still pass the checks (the API refuses
    // the edit otherwise), so the site never shows a logo without alt text.
    const action = existing?.status === "Published" ? "publish" : "draft";
    setSaving(true);
    try {
      upsert(await saveContent("logos", existing, result.data, action));
      toast(`${result.data.name} saved.`);
      onDone();
    } catch (error) {
      setSaving(false);
      if (error instanceof VersionConflictError) {
        upsert(error.current as ClientLogo);
        toast(`${error.changedBy} changed this logo while you were editing. Their version is shown now; please make your change again.`, "error");
        onDone();
      } else if (error instanceof ContentApiError) {
        for (const [name, message] of Object.entries(error.fields)) {
          if (name === "name" || name === "logo" || name === "websiteUrl") setError(name, { message });
        }
        toast(error.message, "error");
      } else {
        toast("Couldn't save the logo. Please try again.", "error");
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormField id={fieldId("name")} label="Client name" error={errors.name}>
        <input id={fieldId("name")} type="text" className={inputClass} {...ariaFor(fieldId("name"), errors.name)} {...register("name")} />
      </FormField>
      <Controller
        control={control}
        name="logo"
        render={({ field }) => (
          <ImageField
            label="Logo"
            usage="logo"
            value={field.value}
            onChange={field.onChange}
            error={errors.logo?.message}
            previewShape="wide"
            altHint="Usually the company name followed by “logo”, e.g. “Brooks Physio logo”."
          />
        )}
      />
      <FormField id={fieldId("websiteUrl")} label="Website URL (optional)" error={errors.websiteUrl}>
        <input
          id={fieldId("websiteUrl")}
          type="url"
          inputMode="url"
          placeholder="https://"
          className={inputClass}
          {...ariaFor(fieldId("websiteUrl"), errors.websiteUrl)}
          {...register("websiteUrl")}
        />
      </FormField>
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={onDone} disabled={saving} className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface disabled:opacity-60">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60">
          {saving ? "Saving…" : "Save logo"}
        </button>
      </div>
    </form>
  );
}
