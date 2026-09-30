"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Role } from "@/lib/auth/types";

type AdminUser = { name: string; role: Role };

const AdminUserContext = createContext<AdminUser | null>(null);

// The signed-in team member, for client components that show or record who did something
// (post authors, proposal sign-offs). Loaded once in the admin panel layout.
export function AdminUserProvider({ user, children }: { user: AdminUser; children: ReactNode }) {
  return <AdminUserContext.Provider value={user}>{children}</AdminUserContext.Provider>;
}

export function useAdminUser(): AdminUser {
  const user = useContext(AdminUserContext);
  if (!user) throw new Error("useAdminUser must be used inside <AdminUserProvider>");
  return user;
}
