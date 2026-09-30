"use client";

import type { RefObject } from "react";
import InquiryForm from "@/components/inquiry/InquiryForm";
import Modal from "@/components/ui/Modal";
import type { InquiryFormValues } from "@/lib/validation/inquiry";

// The shared Modal is a native <dialog>: focus moves inside on open, Tab is trapped, Escape
// closes it and focus returns to the button that opened it (FR-022).
export default function InquiryModal({
  open,
  onClose,
  returnFocusRef,
  initialValues,
  onDraftChange,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  initialValues: Partial<InquiryFormValues>;
  onDraftChange: (values: Partial<InquiryFormValues>) => void;
  onSubmitted: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Start a project"
      description="Tell us a little about your business and the crew will be in touch."
      returnFocusRef={returnFocusRef}
    >
      <InquiryForm initialValues={initialValues} onDraftChange={onDraftChange} onSubmitted={onSubmitted} />
    </Modal>
  );
}
