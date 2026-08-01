"use client";

import { Siren } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { FullScreenLoader } from "@/components/shared/full-screen-loader";
import { useAuth } from "@/providers/auth-provider";

/**
 * Auth layout - wraps /login and /register.
 *
 * Mirrors the dashboard layout's auth-guard pattern but inverted: the
 * dashboard redirects AWAY from itself when logged OUT, this redirects
 * AWAY from itself when logged IN. Without this, a logged-in user who
 * navigates back to /login (e.g. via browser history) would see a login
 * form instead of being sent to the app they're already authenticated
 * into - confusing and unnecessary.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/chat");
    }
  }, [loading, user, router]);

  if (loading) {
    return <FullScreenLoader label="Loading..." />;
  }

  if (user) {
    return null; // Redirect in flight.
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
          <Siren className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-base font-semibold text-foreground">Disaster OS</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
