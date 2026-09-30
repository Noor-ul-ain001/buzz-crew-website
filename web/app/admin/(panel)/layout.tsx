import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import IdleTimeoutWarning from "@/components/admin/IdleTimeoutWarning";
import { LeadsProvider } from "@/components/admin/LeadsProvider";
import SignOutButton from "@/components/admin/SignOutButton";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { getCurrentUser } from "@/lib/auth/session";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Every admin page checks the session with the API; roles are enforced there too (FR-002).
  const user = await getCurrentUser();
  const isAdmin = user.role === "admin";

  const shell = (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <header className="border-b border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5 lg:py-6">
          <Link href="/admin" className="rounded-md">
            <Logo />
            <span className="sr-only"> admin</span>
          </Link>
          <div className="flex items-center gap-1">
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground capitalize">
              {user.role}
            </span>
            <ThemeToggle />
          </div>
        </div>
        <nav aria-label="Admin" className="overflow-x-auto px-2 pb-2 lg:overflow-visible lg:px-3 lg:pb-0">
          <AdminNav
            role={user.role}
            className="flex w-max gap-1 lg:w-auto lg:flex-col"
            linkClassName="block rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap hover:bg-background aria-[current=page]:bg-background aria-[current=page]:font-semibold aria-[current=page]:shadow-sm"
          />
        </nav>
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm lg:mt-auto lg:block lg:px-5 lg:py-4">
          <p className="font-medium">{user.name}</p>
          <div className="flex items-center gap-3 lg:mt-1">
            <Link href="/" className="text-muted hover:text-foreground">
              View public site
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="min-w-0 flex-1">{children}</div>
      <IdleTimeoutWarning />
    </div>
  );

  // Lead data only reaches admins' browsers.
  return isAdmin ? <LeadsProvider>{shell}</LeadsProvider> : shell;
}
