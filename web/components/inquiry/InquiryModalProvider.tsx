"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { InquiryFormValues } from "@/lib/validation/inquiry";

// The modal and form load on first open so they never weigh on page load (research R11).
const InquiryModal = dynamic(() => import("@/components/inquiry/InquiryModal"), { ssr: false });

export type OpenInquiryOptions = {
  /** Pre-selects services, e.g. from a service page or case study. */
  services?: InquiryFormValues["services"];
  /** Pre-fills the message, e.g. a chat summary or an estimate. */
  message?: string;
};

type InquiryContextValue = {
  openInquiry: (options?: OpenInquiryOptions) => void;
};

const InquiryContext = createContext<InquiryContextValue | null>(null);

export function useInquiry(): InquiryContextValue | null {
  return useContext(InquiryContext);
}

export default function InquiryModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Values typed so far are kept while the visitor stays on this page (spec edge case);
  // a draft saved on another page is ignored.
  const [saved, setSaved] = useState<{ path: string; values: Partial<InquiryFormValues> }>({
    path: pathname,
    values: {},
  });
  const draft = saved.path === pathname ? saved.values : {};
  const setDraft = useCallback(
    (values: Partial<InquiryFormValues>) => setSaved({ path: pathname, values }),
    [pathname],
  );
  const [formKey, setFormKey] = useState(0);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openInquiry = useCallback(
    (options?: OpenInquiryOptions) => {
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (options?.services?.length || options?.message) {
        setSaved((current) => ({
          path: pathname,
          values: {
            ...(current.path === pathname ? current.values : {}),
            ...(options.services?.length ? { services: options.services } : {}),
            ...(options.message ? { message: options.message } : {}),
          },
        }));
        setFormKey((key) => key + 1);
      }
      setLoaded(true);
      setOpen(true);
    },
    [pathname],
  );

  const value = useMemo(() => ({ openInquiry }), [openInquiry]);

  return (
    <InquiryContext.Provider value={value}>
      {children}
      {loaded && (
        <InquiryModal
          key={`${pathname}:${formKey}`}
          open={open}
          onClose={() => setOpen(false)}
          returnFocusRef={triggerRef}
          initialValues={draft}
          onDraftChange={setDraft}
          onSubmitted={() => setDraft({})}
        />
      )}
    </InquiryContext.Provider>
  );
}
