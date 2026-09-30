"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "error";
type Toast = { id: number; message: string; tone: ToastTone };
type ShowToast = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<ShowToast | null>(null);

const DISMISS_AFTER_MS = 5000;
const REGION_CLASS = "flex w-full flex-col items-center gap-2 sm:items-end";

export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}

// The live regions stay mounted, so screen readers announce each toast as it is added.
// Errors use role="alert" so they interrupt; confirmations are polite.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback<ShowToast>((message, tone = "success") => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96 sm:items-end">
        <div role="status" className={REGION_CLASS}>
          {toasts
            .filter((toast) => toast.tone === "success")
            .map((toast) => (
              <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
        </div>
        <div role="alert" className={REGION_CLASS}>
          {toasts
            .filter((toast) => toast.tone === "error")
            .map((toast) => (
              <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => onDismiss(toast.id), DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
  }, [paused, toast.id, onDismiss]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg motion-safe:transition-[opacity,translate] motion-safe:duration-200 motion-safe:starting:translate-y-2 motion-safe:starting:opacity-0 ${
        toast.tone === "error"
          ? "border-danger bg-background text-foreground"
          : "border-foreground bg-foreground text-background"
      }`}
    >
      <span aria-hidden="true" className={`mt-0.5 font-bold ${toast.tone === "error" ? "text-danger" : ""}`}>
        {toast.tone === "error" ? "!" : "✓"}
      </span>
      <p className="flex-1 font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="-m-1 rounded p-1 opacity-70 hover:opacity-100"
      >
        <span className="sr-only">Dismiss notification</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
