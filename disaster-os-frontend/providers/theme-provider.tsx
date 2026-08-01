"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Theme provider - thin wrapper around next-themes.
 *
 * Kept as its own file/component (rather than folded into AuthProvider)
 * because theme and auth are unrelated concerns that happen to both be
 * "app-wide providers" - mixing them into one component would make each
 * harder to reason about and test independently.
 *
 * defaultTheme="light": the Apple/Stripe/Linear design direction is
 * fundamentally light-first (precise neutral grays, restrained accent,
 * generous whitespace) - forcing dark-first would fight that first
 * impression. Dark mode is still fully supported and toggleable; it's
 * just no longer the default.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
