"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

// Dark by default (the brand look, built around the logo). Visitors can switch to light or
// to their system setting; the choice is remembered in localStorage. The "dark" class on
// <html> drives the CSS variables in globals.css.
export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
