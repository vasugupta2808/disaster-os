"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";

/**
 * App header - sits above page content inside the dashboard shell.
 * Redesigned with tactical glassmorphism.
 */
export function AppHeader({ title }: { title: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b-0 px-6 my-2 mx-4 rounded-2xl glass-panel sticky top-2 z-30">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="hover:bg-primary/10 transition-colors" />
        <h1 className="text-base font-semibold text-foreground tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
