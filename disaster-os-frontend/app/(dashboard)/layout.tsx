"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { FullScreenLoader } from "@/components/shared/full-screen-loader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Beams from "@/components/ui/beams";
import LightRays from "@/components/ui/light-rays";
import { useAuth } from "@/providers/auth-provider";

/**
 * Dashboard layout - wraps every feature route (chat, sos, shelters, etc.)
 *
 * This is the ONE place auth-gating happens for all ten features. Every
 * route nested under app/(dashboard)/ automatically gets:
 *   1. A redirect to /login if the user isn't authenticated
 *   2. A loading state while we're still determining auth status
 *   3. The sidebar + header shell
 *
 * Without this route-group layout, each of the ten feature pages would
 * need to repeat steps 1 and 2 itself - ten places to get the redirect
 * logic right (or wrong) instead of one.
 *
 * Why this is a Client Component ("use client"): it needs useAuth() and
 * useRouter(), both client-only hooks. The redirect happens via
 * useEffect rather than during render to avoid React's
 * "cannot update state during render" issues when navigating away.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <FullScreenLoader label="Checking your session..." />;
  }

  // Redirect is in flight (effect above will fire) - render nothing
  // rather than flashing the dashboard shell for an unauthenticated user.
  if (!user) {
    return null;
  }

  const currentNavItem = NAV_ITEMS.find((item) => item.href === pathname);
  const isSos = pathname === "/sos";
  const isLightRaysPage = ["/shelters", "/fire-stations", "/police", "/hospitals"].includes(pathname);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative bg-transparent transition-colors duration-300">
        {!isSos && !isLightRaysPage && (
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <Beams
              beamWidth={2}
              beamHeight={15}
              beamNumber={12}
              lightColor="#ffffff"
              speed={2}
              noiseIntensity={1.75}
              scale={0.2}
              rotation={0}
            />
          </div>
        )}
        {isLightRaysPage && (
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <LightRays
              raysOrigin="top-center"
              raysColor="#00ffff"
              raysSpeed={1.5}
              lightSpread={0.8}
              rayLength={1.2}
              followMouse={true}
              mouseInfluence={0.1}
              noiseAmount={0.1}
              distortion={0.05}
            />
          </div>
        )}
        <AppHeader title={currentNavItem?.label ?? "Disaster OS"} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
