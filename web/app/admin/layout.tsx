import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | The Buzz Crew" },
  robots: { index: false, follow: false },
};

// Sign-in screens live in (auth); everything behind a session lives in (panel).
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <ToastProvider>{children}</ToastProvider>;
}
