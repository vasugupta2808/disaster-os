import { apiClient } from "@/lib/api/client";
import type { DisasterAnalysisResult } from "@/types/disaster-analysis";

/**
 * Disaster analysis API call.
 *
 * Uses the standard apiClient (not the streaming chat.ts pattern) since
 * this endpoint returns one structured JSON object, not progressive
 * text - there's nothing to stream, so the simpler request/response
 * client is the right tool here.
 */
export function analyzeDisasterSituation(params: {
  situation: string;
  latitude?: number;
  longitude?: number;
}): Promise<DisasterAnalysisResult> {
  return apiClient.post<DisasterAnalysisResult>("/api/v1/disaster-analysis", {
    situation: params.situation,
    latitude: params.latitude,
    longitude: params.longitude,
  });
}
