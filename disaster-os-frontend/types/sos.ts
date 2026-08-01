/**
 * SOS Emergency System types — mirror app/schemas/sos.py JSON output.
 * Backend uses CamelCaseModel so all multi-word fields are camelCase.
 */

export type SosStatus = "pending" | "active" | "acknowledged" | "responding" | "resolved" | "cancelled";
export type SosSeverity = "critical" | "high" | "medium";

export interface EmergencyContact {
  label: string;
  number: string;
}

export interface SosGuidance {
  urgency: import("./domain").Severity;
  situationSummary: string;
  instructions: string[];
  emergencyNumbers: EmergencyContact[];
}

export interface SosRequest {
  id: string;
  uid: string;
  status: SosStatus;
  severity: SosSeverity;
  situation: string;
  latitude: number;
  longitude: number;
  locationLabel: string;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
  resolvedBy: string | null;
  resolutionNote: string | null;
  message?: string;
  emergencyType: string;
  guidance: SosGuidance;
}
