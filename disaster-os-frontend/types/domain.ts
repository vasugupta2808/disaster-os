/**
 * Core domain types, shared across features.
 *
 * This file grows incrementally as we build each feature - we don't
 * pre-declare types for features that don't exist yet, since speculative
 * types tend to be wrong and rot unused. Each feature step adds exactly
 * the types it needs, here or in a feature-specific types file.
 */

/** The authenticated user, as our app understands them - a thin
 * projection of Firebase's User object, not the raw SDK type, so the
 * rest of the app isn't coupled to Firebase's shape directly. */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/** Severity scale shared across alerts, SOS priority, and image-analysis
 * risk results - matches the `severity` color tokens in tailwind.config.ts. */
export type Severity = "critical" | "high" | "medium" | "low" | "info";

/** Current-conditions weather snapshot for the Home overview dashboard.
 * Deliberately small - this is a glance-able summary, not the full
 * forecast (a dedicated weather view, if we build one, would want more). */
export interface WeatherSnapshot {
  locationLabel: string;
  temperatureCelsius: number;
  condition: string;
  /** Short, human description of any active weather-related risk, e.g.
   * "Heavy rain expected - flood risk." Null when conditions are normal. */
  riskNote: string | null;
  windSpeedKph: number;
  humidityPercent: number;
  observedAt: string; // ISO 8601
}

/** A single live disaster alert, as shown in the Home preview list and
 * the full Alerts page. Sourced from ReliefWeb / OpenWeather / NASA FIRMS
 * on the backend, normalized to this one shape regardless of origin. */
export interface DisasterAlert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  source: "reliefweb" | "openweather" | "nasa_firms";
  /** Human-readable area name, e.g. "Greater Noida, Uttar Pradesh". */
  locationLabel: string;
  publishedAt: string; // ISO 8601
  url: string | null;
}
