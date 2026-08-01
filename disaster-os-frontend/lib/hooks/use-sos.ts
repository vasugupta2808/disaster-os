"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ApiError, NetworkError } from "@/lib/api/client";
import { cancelSos, createSos, getMyActiveSos } from "@/lib/api/sos";
import { subscribeSosStatus } from "@/lib/firebase/firestore-listeners";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import type { SosRequest, SosSeverity } from "@/types/sos";

/**
 * useS0S — manages the full SOS lifecycle for the user-facing page.
 *
 * On mount: checks if the user already has an active SOS (via the
 * backend REST endpoint) and, if so, immediately starts a Firestore
 * listener on that document so status updates arrive in real-time.
 *
 * On send: creates the SOS via the backend, then switches from the
 * send form to the status tracker and starts the Firestore listener.
 *
 * On cancel: cancels via the backend, stops the listener, resets state.
 */
export function useSos() {
  const geo = useGeolocation();
  const [activeSos, setActiveSos] = useState<SosRequest | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /** Starts the Firestore realtime listener for a given SOS ID and
   * stores the unsubscribe function so we can clean it up. */
  const startListener = useCallback((sosId: string) => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = subscribeSosStatus(sosId, (updated) => {
      setActiveSos(updated);
    });
  }, []);

  /** Stops any active listener and clears related state. */
  const stopListener = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
  }, []);

  // On mount, check if the user already has an active SOS.
  useEffect(() => {
    let cancelled = false;

    getMyActiveSos()
      .then((existing) => {
        if (cancelled) return;
        if (existing) {
          setActiveSos(existing);
          startListener(existing.id);
        }
      })
      .catch(() => {
        // Silent failure on initial check — not showing an error here
        // since the user hasn't done anything yet and the page is still
        // usable (they can still send a new SOS).
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [startListener]);

  // Cleanup listener on unmount.
  useEffect(() => () => stopListener(), [stopListener]);

  const sendSos = useCallback(
    async (params: { situation: string; severity: SosSeverity }) => {
      if (geo.latitude === null || geo.longitude === null) {
        setError("Could not get your location. Please enable location access and try again.");
        return;
      }

      setSending(true);
      setError(null);

      try {
        const created = await createSos({
          situation: params.situation,
          severity: params.severity,
          latitude: geo.latitude,
          longitude: geo.longitude,
          locationLabel: `${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)}`,
        });

        setActiveSos(created);
        startListener(created.id);
        toast.success("SOS sent. Help is on the way.", { duration: 5000 });
      } catch (err) {
        const message =
          err instanceof NetworkError || err instanceof ApiError
            ? err.message
            : "Could not send SOS. Please try again.";
        setError(message);
        toast.error(message);
      } finally {
        setSending(false);
      }
    },
    [geo.latitude, geo.longitude, startListener],
  );

  const cancel = useCallback(async () => {
    if (!activeSos) return;
    setCancelling(true);
    setError(null);

    try {
      await cancelSos(activeSos.id);
      stopListener();
      setActiveSos(null);
      toast.info("SOS cancelled.");
    } catch (err) {
      const message =
        err instanceof NetworkError || err instanceof ApiError
          ? err.message
          : "Could not cancel SOS. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  }, [activeSos, stopListener]);

  return {
    activeSos,
    initialLoading,
    sending,
    cancelling,
    error,
    locationLoading: geo.loading,
    locationDenied: geo.permissionDenied,
    userLatitude: geo.latitude,
    userLongitude: geo.longitude,
    sendSos,
    cancel,
  };
}
