"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, Navigation, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DirectionsResult, NearbyPlace } from "@/types/maps";

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${meters} m`;
}

export function DirectionsPanel({
  place,
  directions,
  loading,
  error,
  onClose,
  onGetDirections,
}: {
  place: NearbyPlace;
  directions: DirectionsResult | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onGetDirections: () => void;
}) {
  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 24, stiffness: 200 }}
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{place.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{place.address}</p>
          {place.phoneNumber ? (
            <a
              href={`tel:${place.phoneNumber}`}
              className="mt-1 text-xs font-medium text-primary hover:underline"
            >
              {place.phoneNumber}
            </a>
          ) : null}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Directions content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!directions && !loading && !error ? (
          <Button onClick={onGetDirections} className="w-full gap-2">
            <Navigation className="h-4 w-4" />
            Get directions
          </Button>
        ) : loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={onGetDirections} className="w-full gap-2">
              <Navigation className="h-4 w-4" />
              Try again
            </Button>
          </div>
        ) : directions ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4 rounded-lg bg-secondary p-3 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                {formatDuration(directions.durationSeconds)}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {formatDistance(directions.distanceMeters)}
              </span>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Turn-by-turn
              </p>
              {directions.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-md border border-border/60 p-2.5 text-xs"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground font-medium">
                    {i + 1}
                  </span>
                  <div>
                    {/* instruction_html may contain <b> tags from the API,
                        rendering as innerHTML is intentional here */}
                    <span
                      className="text-foreground"
                      dangerouslySetInnerHTML={{ __html: step.instructionHtml }}
                    />
                    <span className="ml-1 text-muted-foreground">
                      — {formatDistance(step.distanceMeters)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
