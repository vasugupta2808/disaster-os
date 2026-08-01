"use client";

import { motion } from "framer-motion";
import { MapPin, Phone } from "lucide-react";
import Tilt from "react-parallax-tilt";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { NearbyPlace, PlaceType } from "@/types/maps";

const PLACE_TYPE_LABEL: Record<PlaceType, string> = {
  shelter: "Shelter",
  hospital: "Hospital",
  police: "Police Station",
  fire_station: "Fire Station",
};

export function PlacesList({
  places,
  loading,
  error,
  selectedPlace,
  placeType,
  onSelect,
}: {
  places: NearbyPlace[];
  loading: boolean;
  error: string | null;
  selectedPlace: NearbyPlace | null;
  placeType: PlaceType;
  onSelect: (place: NearbyPlace) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
        <MapPin className="h-5 w-5" strokeWidth={1.5} />
        No {PLACE_TYPE_LABEL[placeType].toLowerCase()}s found nearby.
      </div>
    );
  }

  return (
    <div className="space-y-1.5 p-3">
      {places.map((place, index) => {
        const isSelected = selectedPlace?.placeId === place.placeId;
        return (
          <Tilt
            key={place.placeId}
            tiltMaxAngleX={6}
            tiltMaxAngleY={6}
            scale={1.02}
            transitionSpeed={2000}
            className="w-full"
          >
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: index * 0.04 }}
              onClick={() => onSelect(place)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition-colors",
                isSelected
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-border hover:bg-secondary",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {place.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {place.address}
                  </p>
                  {place.phoneNumber ? (
                    <span className="mt-1 flex items-center gap-1 text-xs text-primary">
                      <Phone className="h-3 w-3" />
                      {place.phoneNumber}
                    </span>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {place.distanceKm !== null ? (
                    <span className="text-xs font-medium text-muted-foreground">
                      {place.distanceKm} km
                    </span>
                  ) : null}
                  {place.openNow !== null ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        place.openNow
                          ? "border-severity-low/30 bg-severity-low/10 text-severity-low"
                          : "border-border bg-secondary text-muted-foreground",
                      )}
                    >
                      {place.openNow ? "Open" : "Closed"}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </motion.button>
          </Tilt>
        );
      })}
    </div>
  );
}
