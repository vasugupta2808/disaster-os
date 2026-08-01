import { apiClient } from "@/lib/api/client";
import type { WeatherSnapshot } from "@/types/domain";

/**
 * Weather API calls.
 *
 * Why this hits OUR backend, not OpenWeather directly: per our
 * architecture decision, the backend proxies all external APIs. This
 * keeps the OpenWeather API key server-side only, lets us cache/retry on
 * the backend (tenacity), and means if we ever swap weather providers,
 * this function's signature doesn't change.
 */
export function getWeatherSnapshot(params: {
  latitude: number;
  longitude: number;
}): Promise<WeatherSnapshot> {
  const query = new URLSearchParams({
    lat: String(params.latitude),
    lon: String(params.longitude),
  });
  return apiClient.get<WeatherSnapshot>(`/api/v1/weather/snapshot?${query.toString()}`);
}
