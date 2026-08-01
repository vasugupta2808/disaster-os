import { apiClient } from "@/lib/api/client";
import type { SosRequest, SosSeverity, SosStatus } from "@/types/sos";

export function createSos(params: {
  situation: string;
  severity: SosSeverity;
  latitude: number;
  longitude: number;
  locationLabel?: string;
}): Promise<SosRequest> {
  return apiClient.post<SosRequest>("/api/v1/sos", {
    situation: params.situation,
    severity: params.severity,
    latitude: params.latitude,
    longitude: params.longitude,
    locationLabel: params.locationLabel ?? "Unknown location",
  });
}

export function cancelSos(sosId: string): Promise<SosRequest> {
  return apiClient.delete<SosRequest>(`/api/v1/sos/${sosId}`);
}

export function getMyActiveSos(): Promise<SosRequest | null> {
  return apiClient.get<SosRequest | null>("/api/v1/sos/me");
}

export function listAllSos(): Promise<SosRequest[]> {
  return apiClient.get<SosRequest[]>("/api/v1/sos/admin/all");
}

export function updateSosStatus(params: {
  sosId: string;
  status: SosStatus;
  resolutionNote?: string;
}): Promise<SosRequest> {
  return apiClient.patch<SosRequest>(`/api/v1/sos/admin/${params.sosId}/status`, {
    status: params.status,
    resolutionNote: params.resolutionNote ?? null,
  });
}
