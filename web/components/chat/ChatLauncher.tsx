"use client";

import dynamic from "next/dynamic";
import { useCallback, useId, useRef, useState } from "react";

// Only this small launcher ships with every page. The panel (and the chat logic) is a
// separate chunk, fetched when the visitor shows interest (hover or focus) or opens it.
const loadPanel = () => import("@/components/chat/ChatPanel");
const ChatPanel = dynamic(loadPanel, {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background sm:inset-auto sm:right-6 sm:bottom-6 sm:h-40 sm:w-[380px] sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl">
      <p role="status" className="text-sm text-muted">
        Loading the assistant…
      </p>
    </div>
  ),
});

export default function ChatLauncher() {
  const panelId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  // Stays true after the first open so the conversation survives closing the panel.
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        aria-expanded={open}
        aria-controls={mounted ? panelId : undefined}
        onPointerEnter={loadPanel}
        onFocus={loadPanel}
        onClick={() => {
          setMounted(true);
          setOpen((value) => !value);
        }}
        // Bottom-right corner; smaller and tucked in on very narrow screens.
        className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 inline-flex size-14 max-[359px]:right-2 max-[359px]:bottom-2 max-[359px]:size-10 max-[359px]:[&_svg]:size-5 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform motion-safe:hover:scale-105 sm:right-6 sm:bottom-6"
      >
        <span className="sr-only">{open ? "Close" : "Open"} the Buzz Crew AI assistant</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
          <path d="M12 8.5l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9z" fill="currentColor" />
        </svg>
      </button>
      {mounted && <ChatPanel id={panelId} open={open} onClose={close} />}
    </>
  );
}
