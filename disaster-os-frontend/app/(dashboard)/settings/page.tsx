"use client";

import { Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth-provider";

/**
 * Settings page.
 *
 * Kept deliberately minimal — the items here are the ones we actually
 * have the data/logic to back right now (account info from Firebase Auth,
 * theme toggle already wired via next-themes). Placeholder sections for
 * notification preferences, emergency contacts, etc. are not listed
 * because a settings item that leads nowhere is worse than not listing
 * it — they'll be added when the backing feature exists.
 */
export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        </div>
      </div>

      {/* Account */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Account</h2>
        <Separator className="my-3" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            {user ? (
              <>
                <p className="text-sm font-medium text-foreground">
                  {user.displayName ?? "No display name set"}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </>
            ) : (
              <>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-48" />
              </>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void signOut()}
            className="text-severity-critical hover:border-severity-critical/40 hover:bg-severity-critical/5 hover:text-severity-critical"
          >
            Sign out
          </Button>
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
        <Separator className="my-3" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Theme</p>
            <p className="text-xs text-muted-foreground">
              Light or dark — your preference is saved.
            </p>
          </div>
          {mounted ? (
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              <Button
                variant={theme === "light" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 gap-1.5 px-2.5 text-xs"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-3.5 w-3.5" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 gap-1.5 px-2.5 text-xs"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-3.5 w-3.5" />
                Dark
              </Button>
            </div>
          ) : (
            <Skeleton className="h-9 w-32 rounded-lg" />
          )}
        </div>
      </section>

      {/* App info */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">About</h2>
        <Separator className="my-3" />
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono text-xs text-foreground">0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span>AI Model</span>
            <span className="text-xs text-foreground">Gemini 2.0 Flash</span>
          </div>
        </div>
      </section>
    </div>
  );
}
