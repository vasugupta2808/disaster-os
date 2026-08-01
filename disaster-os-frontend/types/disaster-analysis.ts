/**
 * Disaster analysis types - mirror app/schemas/disaster_analysis.py's
 * JSON output exactly. The backend serializes via CamelCaseModel (see
 * app/schemas/base.py), so these fields are camelCase, matching normal
 * TypeScript convention - NOT a 1:1 copy of the backend's internal
 * Python (snake_case) field names, only of its JSON wire format.
 */

import type { Severity } from "@/types/domain";

export type DisasterType =
  | "earthquake"
  | "flood"
  | "fire"
  | "hurricane_cyclone"
  | "tornado"
  | "landslide"
  | "tsunami"
  | "heatwave"
  | "cold_wave"
  | "drought"
  | "industrial_hazmat"
  | "medical_emergency"
  | "civil_unrest"
  | "other"
  | "unknown";

/** Backend's `UrgencyLevel` enum uses the exact same string values as
 * our existing `Severity` type (types/domain.ts) - reused directly
 * rather than redeclared, so urgency renders with the same color tokens
 * as alerts/SOS everywhere else in the app. */
export type UrgencyLevel = Severity;

export interface EmergencyNumber {
  label: string;
  number: string;
}

export interface ShelterRecommendation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  placeId: string | null;
}

export interface DisasterAnalysisResult {
  disasterType: DisasterType;
  urgency: UrgencyLevel;
  summary: string;
  instructions: string[];
  emergencyNumbers: EmergencyNumber[];
  shelters: ShelterRecommendation[];
  reasoningNote: string | null;
}
