import Link from "next/link";
import Logo from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 inline-block rounded-md">
          <Logo />
          <span className="sr-only"> home</span>
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </div>
  );
}
