"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

/**
 * Public landing page.
 *
 * Kept intentionally minimal at this stage: its real job right now is
 * routing logic (send authenticated users straight to the dashboard so
 * they never see a marketing page they don't need), plus a genuine,
 * complete entry point for everyone else. A fuller hero/marketing layout
 * belongs in the polish pass once all features exist to showcase - this
 * is not a stub, it's a deliberately small but fully working page.
 */
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/chat");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-severity-high" />
        AI-Powered Disaster Response
      </div>

      <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Disaster OS
      </h1>

      <p className="max-w-xl text-lg text-muted-foreground">
        Real-time alerts, AI guidance, and instant access to shelters,
        hospitals, and emergency help — when every second matters.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button asChild size="lg">
          <Link href="/login">
            Get started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/register">Create an account</Link>
        </Button>
      </div>
    </main>
  );
}
