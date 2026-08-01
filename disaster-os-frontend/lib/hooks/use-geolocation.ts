"use client";

import { useEffect, useState } from "react";

/**
 * useGeolocation - shared across Home, Map (shelters/hospitals/fire
 * stations), SOS, and Alerts. Every one of those features needs "where is
 * the user right now" - building this once here means each feature gets
 * consistent permission-denied / unsupported-browser / loading handling,
 * instead of four slightly different implementations.
 *
 * Why we don't auto-retry on denial: if a user explicitly denies location
 * permission, repeatedly re-prompting is both annoying and against
 * browser UX norms. We surface the denial as state and let each feature
 * decide its own fallback (e.g. SOS might fall back to manual address
 * entry; Home might just hide the weather card).
 */

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  /** Specifically true when the user denied the permission prompt -
   * distinct from `error`, which covers other failures (timeout,
   * unsupported browser, position unavailable). */
  permissionDenied: boolean;
  error: string | null;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: true,
    permissionDenied: false,
    error: null,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Your browser does not support geolocation.",
      }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          permissionDenied: false,
          error: null,
        });
      },
      (error) => {
        const permissionDenied = error.code === error.PERMISSION_DENIED;
        setState((prev) => ({
          ...prev,
          loading: false,
          permissionDenied,
          error: permissionDenied
            ? "Location access was denied."
            : "Could not determine your location.",
        }));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
