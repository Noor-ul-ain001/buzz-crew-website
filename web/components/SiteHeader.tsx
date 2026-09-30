import Link from "next/link";
import Logo from "@/components/Logo";
import MobileMenu from "@/components/nav/MobileMenu";
import NavLinks from "@/components/nav/NavLinks";
import StartProjectButton from "@/components/inquiry/StartProjectButton";

export default function SiteHeader() {
  return (
    // Sticky and translucent, so the indigo page shows through as you scroll.
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 min-[400px]:gap-3 min-[400px]:px-4 sm:px-6">
        <Link href="/" aria-label="The Buzz Crew, home" className="rounded-md text-lg">
          {/* Very narrow phones show the mark only, so the CTA and menu button still fit. */}
          <Logo wordmarkClassName="max-[400px]:sr-only" />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <NavLinks
            className="flex items-center gap-1"
            linkClassName="block px-3 py-2 text-sm font-medium text-muted underline-offset-[10px] link-sweep bg-origin-content transition-colors duration-200 hover:text-foreground aria-[current=page]:bg-none aria-[current=page]:text-foreground aria-[current=page]:underline aria-[current=page]:decoration-accent aria-[current=page]:decoration-2"
          />
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Very narrow phones get this button inside the menu instead, so nothing overflows. */}
          <StartProjectButton className="rounded-full bg-accent px-5 py-2 text-sm font-semibold whitespace-nowrap text-accent-foreground hover:brightness-95 max-[399px]:hidden" />
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
