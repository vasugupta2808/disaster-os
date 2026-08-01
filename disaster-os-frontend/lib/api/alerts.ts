import { apiClient } from "@/lib/api/client";
import type { DisasterAlert } from "@/types/domain";

/**
 * Disaster alerts API calls.
 *
 * `limit` exists specifically so the Home dashboard's "recent alerts
 * preview" and the full Alerts page can share this one function while
 * asking for different amounts of data (e.g. Home wants 3, Alerts wants
 * everything) - avoids needing two near-duplicate functions.
 */
export function getDisasterAlerts(params?: {
  latitude?: number;
  longitude?: number;
  limit?: number;
}): Promise<DisasterAlert[]> {
  const query = new URLSearchParams();
  if (params?.latitude !== undefined) query.set("lat", String(params.latitude));
  if (params?.longitude !== undefined) query.set("lon", String(params.longitude));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient.get<DisasterAlert[]>(`/api/v1/alerts${qs ? `?${qs}` : ""}`);
}
