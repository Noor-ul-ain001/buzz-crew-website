"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { deleteContent, reorderContent } from "@/lib/content/admin-api";
import type { ContentCollections, ContentKind } from "@/lib/content/types";

type Collections = { [K in ContentKind]: ContentCollections[K][] };

type ContentContextValue = {
  collections: Collections;
  /** Puts an item the API already saved into the list (new ids go to the end). */
  upsert: <K extends ContentKind>(kind: K, item: ContentCollections[K]) => void;
  remove: (kind: ContentKind, id: string) => Promise<void>;
  /** Optimistic: the new order shows at once and is rolled back if saving fails. */
  reorder: (kind: ContentKind, ids: string[]) => Promise<void>;
};

const ContentContext = createContext<ContentContextValue | null>(null);

export function useContent<K extends ContentKind>(kind: K) {
  const value = useContext(ContentContext);
  if (!value) throw new Error("useContent must be used inside <ContentProvider>");
  const { collections, upsert, remove, reorder } = value;
  return {
    items: collections[kind],
    upsert: (item: ContentCollections[K]) => upsert(kind, item),
    remove: (id: string) => remove(kind, id),
    reorder: (ids: string[]) => reorder(kind, ids),
  };
}

export function useAllContent(): Collections {
  const value = useContext(ContentContext);
  if (!value) throw new Error("useAllContent must be used inside <ContentProvider>");
  return value.collections;
}

// Session cache of the content collections for the admin area, loaded from the API on the
// server (see app/admin/(panel)/content/layout.tsx), so a change shows on every screen.
export function ContentProvider({ initial, children }: { initial: Collections; children: ReactNode }) {
  const [collections, setCollections] = useState(initial);

  const upsert = useCallback(<K extends ContentKind>(kind: K, item: ContentCollections[K]) => {
    setCollections((current) => {
      const list = current[kind];
      const exists = list.some((existing) => existing.id === item.id);
      const next = exists ? list.map((existing) => (existing.id === item.id ? item : existing)) : [...list, item];
      return { ...current, [kind]: next };
    });
  }, []);

  const remove = useCallback(async (kind: ContentKind, id: string) => {
    await deleteContent(kind, id);
    setCollections((current) => ({ ...current, [kind]: current[kind].filter((item) => item.id !== id) }));
  }, []);

  const reorder = useCallback(
    async (kind: ContentKind, ids: string[]) => {
      const previous = collections[kind];
      const byId = new Map(previous.map((item) => [item.id, item]));
      const next = ids.flatMap((id) => byId.get(id) ?? []);
      setCollections((current) => ({ ...current, [kind]: next }));
      try {
        await reorderContent(kind, ids);
      } catch (error) {
        setCollections((current) => ({ ...current, [kind]: previous }));
        throw error;
      }
    },
    [collections],
  );

  const value = useMemo(
    () => ({ collections, upsert, remove, reorder }),
    [collections, upsert, remove, reorder],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}
