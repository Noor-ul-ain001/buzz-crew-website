"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import { getLastActivity, markActivity, onActivity } from "@/lib/auth/activity";

const IDLE_MS = 30 * 60 * 1000;
const WARN_MS = 28 * 60 * 1000;
const CHECK_EVERY_MS = 10 * 1000;

/** Warns two minutes before the 30-minute idle sign-out (003 T028). */
export default function IdleTimeoutWarning() {
  const pathname = usePathname();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [warning, setWarning] = useState(false);

  // Every page load checks the session on the server, which also resets its idle timer.
  useEffect(() => {
    markActivity();
  }, [pathname]);

  useEffect(() => {
    function check() {
      const idle = Date.now() - getLastActivity();
      if (idle >= IDLE_MS) {
        router.replace("/admin/login?reason=idle");
      } else {
        setWarning(idle >= WARN_MS);
      }
    }
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    const stop = onActivity(() => setWarning(false));
    return () => {
      window.clearInterval(timer);
      stop();
    };
  }, [router]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (warning && !dialog.open) dialog.showModal();
    if (!warning && dialog.open) dialog.close();
  }, [warning]);

  async function staySignedIn() {
    const { response } = await api.POST("/api/v1/auth/session/extend");
    if (!response.ok) router.replace("/admin/login?reason=expired");
  }

  async function signOut() {
    await api.POST("/api/v1/auth/logout");
    router.replace("/admin/login?reason=signed_out");
    router.refresh();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="idle-title"
      aria-describedby="idle-description"
      onCancel={(event) => {
        event.preventDefault();
        void staySignedIn();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-surface p-6 text-foreground backdrop:bg-black/60"
    >
      <h2 id="idle-title" className="text-lg font-bold">
        Are you still there?
      </h2>
      <p id="idle-description" className="mt-2 text-sm text-muted">
        You&apos;ll be signed out in 2 minutes because of inactivity.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          autoFocus
          onClick={staySignedIn}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
        >
          Stay signed in
        </button>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-background"
        >
          Sign out
        </button>
      </div>
    </dialog>
  );
}
