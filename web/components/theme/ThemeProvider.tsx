"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

// Always dark: the brochure's navy and gold, on the public site and in the admin alike.
// The "dark" class on <html> drives the CSS variables in globals.css.
export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" forcedTheme="dark" disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
