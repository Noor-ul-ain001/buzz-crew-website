"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useContent } from "@/components/admin/content/ContentProvider";
import type { PublishAction } from "@/components/admin/content/PublishActions";
import { useToast } from "@/components/ui/Toast";
import { ContentApiError, VersionConflictError, saveContent } from "@/lib/content/admin-api";
import type { ContentCollections } from "@/lib/content/types";

type EditableKind = "testimonials" | "team" | "posts" | "faqs";
type Item<K extends EditableKind> = ContentCollections[K];
type Fields<K extends EditableKind> = Omit<Item<K>, "id" | "status" | "updatedAt" | "version" | "updatedByName" | "thumbnailUrl">;

const SUCCESS: Record<PublishAction, string> = {
  draft: "Draft saved.",
  publish: "Published.",
  unpublish: "Unpublished. It's now a draft and hidden from the site.",
};

export type Conflict<K extends EditableKind> = { current: Item<K>; changedBy: string };

// Shared Save draft / Publish / Unpublish handling for the testimonial, team, post and FAQ
// forms. Everything is saved through the API.
export function usePublishFlow<K extends EditableKind>(
  kind: K,
  existing: Item<K> | undefined,
  listHref: string,
  onFieldErrors: (fields: Record<string, string>) => void,
) {
  const { upsert } = useContent(kind);
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState<PublishAction | null>(null);
  const [conflict, setConflict] = useState<(Conflict<K> & { retry: { action: PublishAction; fields: Fields<K> } }) | null>(null);
  // What the API has saved: set on first save, so a failed publish of a new item patches it.
  const saved = useRef(existing ? { id: existing.id, version: existing.version, status: existing.status } : undefined);

  async function run(action: PublishAction, fields: Fields<K>, version?: number) {
    setPending(action);
    try {
      const base = saved.current && version !== undefined ? { ...saved.current, version } : saved.current;
      const item = (await saveContent(kind, base, fields as never, action)) as Item<K>;
      upsert(item);
      toast(SUCCESS[action]);
      router.push(listHref);
    } catch (error) {
      setPending(null);
      if (error instanceof VersionConflictError) {
        setConflict({ current: error.current as Item<K>, changedBy: error.changedBy, retry: { action, fields } });
      } else if (error instanceof ContentApiError) {
        if (error.saved) {
          saved.current = { id: error.saved.id, version: error.saved.version, status: error.saved.status };
          upsert(error.saved as Item<K>);
        }
        onFieldErrors(error.fields);
        toast(error.message, "error");
      } else {
        toast("Couldn't save your changes. Please try again.", "error");
      }
    }
  }

  /** Keep my changes: save again on top of the newer version. */
  function overwrite() {
    if (!conflict) return;
    setConflict(null);
    void run(conflict.retry.action, conflict.retry.fields, conflict.current.version);
  }

  /** Load the newer version into the form instead; returns it for the form to reset to. */
  function review(): Item<K> | null {
    if (!conflict) return null;
    const { current } = conflict;
    setConflict(null);
    saved.current = { id: current.id, version: current.version, status: current.status };
    upsert(current);
    return current;
  }

  return { pending, run, conflict, overwrite, review, dismissConflict: () => setConflict(null) };
}
