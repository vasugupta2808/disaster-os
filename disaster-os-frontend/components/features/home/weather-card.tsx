"use client";

import { motion } from "framer-motion";

import { CloudRain, Droplets, MapPin, TriangleAlert, Wind } from "lucide-react";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { getWeatherSnapshot } from "@/lib/api/weather";
import { ApiError, NetworkError } from "@/lib/api/client";
import type { WeatherSnapshot } from "@/types/domain";
import Tilt from "react-parallax-tilt";


/**
 * Weather snapshot card - the first thing on the Home dashboard.
 *
 * State machine is explicit and exhaustive on purpose: geolocation
 * loading -> geolocation denied/error -> weather loading -> weather error
 * -> success. A disaster-response tool failing silently (e.g. just
 * showing nothing if location is denied) is worse than a generic app
 * doing the same - the user needs to know WHY they're not seeing data,
 * since it might mean they need to act (grant permission) to get
 * potentially life-relevant information.
 */
export function WeatherCard() {
  const geo = useGeolocation();
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (geo.latitude === null || geo.longitude === null) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getWeatherSnapshot({ latitude: geo.latitude, longitude: geo.longitude })
      .then((data) => {
        if (!cancelled) setWeather(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof NetworkError) {
          setError(err.message);
        } else if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Could not load weather data.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [geo.latitude, geo.longitude]);

  if (geo.loading) {
    return <CardShell><Skeleton className="h-24 w-full" /></CardShell>;
  }

  if (geo.permissionDenied || geo.error) {
    return (
      <CardShell>
        <EmptyNotice
          icon={MapPin}
          message={geo.error ?? "Location access is needed to show local weather."}
        />
      </CardShell>
    );
  }

  if (loading) {
    return <CardShell><Skeleton className="h-24 w-full" /></CardShell>;
  }

  if (error) {
    return (
      <CardShell>
        <EmptyNotice icon={TriangleAlert} message={error} />
      </CardShell>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <CardShell>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{weather.locationLabel}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              {Math.round(weather.temperatureCelsius)}°C
            </p>
            <p className="text-sm text-muted-foreground">{weather.condition}</p>
          </div>
          <CloudRain className="h-8 w-8 text-primary" strokeWidth={1.5} />
        </div>

        <div className="flex items-center gap-4 border-t border-border pt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Wind className="h-3.5 w-3.5" />
            {Math.round(weather.windSpeedKph)} km/h
          </span>
          <span className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5" />
            {weather.humidityPercent}%
          </span>
        </div>

        {weather.riskNote ? (
          <div className="flex items-start gap-2 rounded-md bg-severity-high/10 p-2.5 text-sm text-severity-high">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{weather.riskNote}</span>
          </div>
        ) : null}
      </motion.div>
    </CardShell>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <Tilt tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.02} transitionSpeed={2500}>
      <div className="rounded-2xl glass-panel p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative z-10">{children}</div>
      </div>
    </Tilt>
  );
}

function EmptyNotice({
  icon: Icon,
  message,
}: {
  icon: typeof MapPin;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
