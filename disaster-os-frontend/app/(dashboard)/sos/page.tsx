"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SosForm } from "@/components/features/sos/sos-form";
import { SosStatusCard } from "@/components/features/sos/sos-status-card";
import { useSos } from "@/lib/hooks/use-sos";
import Radar from "@/components/ui/radar";

/**
 * SOS page — the most critical page in the entire app.
 *
 * Two states:
 * 1. No active SOS → send form.
 * 2. Active SOS → live status tracker.
 *
 * All state (including geolocation) comes from useSos, which internally
 * calls useGeolocation and exposes what the form needs. No duplicate
 * hook calls, no require() workarounds.
 */
export default function SosPage() {
  const {
    activeSos,
    initialLoading,
    sending,
    cancelling,
    error,
    locationLoading,
    locationDenied,
    userLatitude,
    userLongitude,
    sendSos,
    cancel,
  } = useSos();

  if (initialLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-50 overflow-hidden">
        <Radar 
          color="#ef4444" 
          backgroundColor="#000000" 
          scale={0.3}
          sweepSpeed={1.5}
          ringCount={8}
          spokeCount={12}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-lg mt-6">

      <div className="relative z-10 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {activeSos ? "SOS Active" : "Send SOS"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeSos
              ? "Your emergency request has been sent. Track its status below."
              : "Send an emergency request with your location to get help fast."}
          </p>
        </div>
      </div>

      {activeSos ? (
        <SosStatusCard sos={activeSos} onCancel={cancel} cancelling={cancelling} />
      ) : (
        <SosForm
          onSend={sendSos}
          sending={sending}
          error={error}
          locationLoading={locationLoading}
          locationDenied={locationDenied}
          userLatitude={userLatitude}
          userLongitude={userLongitude}
        />
      )}
      </div>
    </>
  );
}
