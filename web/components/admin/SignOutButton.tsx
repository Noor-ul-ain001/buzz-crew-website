"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await api.POST("/api/v1/auth/logout");
    router.replace("/admin/login?reason=signed_out");
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} className="text-muted underline hover:text-foreground">
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
