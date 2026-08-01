/**
 * Places and directions types - mirror app/schemas/places.py's JSON
 * output (camelCase, via CamelCaseModel) exactly.
 */

export type PlaceType = "shelter" | "hospital" | "police" | "fire_station";

export interface NearbyPlace {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  phoneNumber: string | null;
  openNow: boolean | null;
}

export interface DirectionsStep {
  instructionHtml: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface DirectionsResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline: string;
  steps: DirectionsStep[];
  destinationName: string;
  destinationAddress: string;
}
