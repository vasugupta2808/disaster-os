import { apiClient } from "@/lib/api/client";
import type { DirectionsResult, NearbyPlace, PlaceType } from "@/types/maps";

export function getNearbyPlaces(params: {
  type: PlaceType;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  limit?: number;
}): Promise<NearbyPlace[]> {
  const query = new URLSearchParams({
    type: params.type,
    lat: String(params.latitude),
    lon: String(params.longitude),
  });
  if (params.radiusMeters !== undefined) query.set("radius", String(params.radiusMeters));
  if (params.limit !== undefined) query.set("limit", String(params.limit));

  return apiClient.get<NearbyPlace[]>(`/api/v1/places/nearby?${query.toString()}`);
}

export function getDirections(params: {
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
}): Promise<DirectionsResult> {
  return apiClient.post<DirectionsResult>("/api/v1/directions", {
    originLatitude: params.originLatitude,
    originLongitude: params.originLongitude,
    destinationLatitude: params.destinationLatitude,
    destinationLongitude: params.destinationLongitude,
  });
}

/** "Safe Route" (per our scoped definition): directions to the nearest
 * VERIFIED shelter from the user's current location - see the backend's
 * SafeRouteRequest docstring for why this isn't hazard-avoidance routing. */
export function getSafeRoute(params: {
  originLatitude: number;
  originLongitude: number;
}): Promise<DirectionsResult> {
  return apiClient.post<DirectionsResult>("/api/v1/safe-route", {
    originLatitude: params.originLatitude,
    originLongitude: params.originLongitude,
  });
}
