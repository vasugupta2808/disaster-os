"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, NetworkError } from "@/lib/api/client";
import { getDirections, getNearbyPlaces } from "@/lib/api/places";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import type { DirectionsResult, NearbyPlace, PlaceType } from "@/types/maps";

/**
 * useNearbyPlaces - shared across all four map pages.
 *
 * Manages geolocation, nearby places fetch, selected place state,
 * and directions fetch in one hook so each of the four thin page
 * components doesn't duplicate the same logic.
 */
export interface UseNearbyPlacesResult {
  places: NearbyPlace[];
  placesLoading: boolean;
  placesError: string | null;
  selectedPlace: NearbyPlace | null;
  directions: DirectionsResult | null;
  directionsLoading: boolean;
  directionsError: string | null;
  userLatitude: number | null;
  userLongitude: number | null;
  locationLoading: boolean;
  locationError: string | null;
  selectPlace: (place: NearbyPlace | null) => void;
  fetchDirections: (place: NearbyPlace) => Promise<void>;
  refetch: () => void;
}

export function useNearbyPlaces(placeType: PlaceType): UseNearbyPlacesResult {
  const geo = useGeolocation();
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const fetchCountRef = useRef(0);

  const fetchPlaces = useCallback(async () => {
    if (geo.latitude === null || geo.longitude === null) return;

    const fetchId = ++fetchCountRef.current;
    setPlacesLoading(true);
    setPlacesError(null);

    try {
      const results = await getNearbyPlaces({
        type: placeType,
        latitude: geo.latitude,
        longitude: geo.longitude,
      });
      if (fetchId === fetchCountRef.current) setPlaces(results);
    } catch (err) {
      if (fetchId !== fetchCountRef.current) return;
      setPlacesError(
        err instanceof NetworkError || err instanceof ApiError
          ? err.message
          : "Could not load nearby locations.",
      );
    } finally {
      if (fetchId === fetchCountRef.current) setPlacesLoading(false);
    }
  }, [geo.latitude, geo.longitude, placeType]);

  useEffect(() => {
    void fetchPlaces();
  }, [fetchPlaces]);

  const fetchDirections = useCallback(
    async (place: NearbyPlace) => {
      if (geo.latitude === null || geo.longitude === null) return;
      setDirectionsLoading(true);
      setDirectionsError(null);
      setDirections(null);
      try {
        const result = await getDirections({
          originLatitude: geo.latitude,
          originLongitude: geo.longitude,
          destinationLatitude: place.latitude,
          destinationLongitude: place.longitude,
        });
        setDirections(result);
      } catch (err) {
        setDirectionsError(
          err instanceof NetworkError || err instanceof ApiError
            ? err.message
            : "Could not get directions.",
        );
      } finally {
        setDirectionsLoading(false);
      }
    },
    [geo.latitude, geo.longitude],
  );

  const selectPlace = useCallback((place: NearbyPlace | null) => {
    setSelectedPlace(place);
    setDirections(null);
    setDirectionsError(null);
  }, []);

  return {
    places,
    placesLoading,
    placesError,
    selectedPlace,
    directions,
    directionsLoading,
    directionsError,
    userLatitude: geo.latitude,
    userLongitude: geo.longitude,
    locationLoading: geo.loading,
    locationError: geo.error,
    selectPlace,
    fetchDirections,
    refetch: fetchPlaces,
  };
}
