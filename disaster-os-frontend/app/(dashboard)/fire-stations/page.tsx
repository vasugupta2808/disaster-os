"use client";

import { NearbyPlacesMap } from "@/components/maps/nearby-places-map";
import { useNearbyPlaces } from "@/lib/hooks/use-nearby-places";

export default function FireStationsPage() {
  const hookResult = useNearbyPlaces("fire_station");
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-4">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Fire Stations</h1>
          <p className="text-sm text-muted-foreground mt-1">Locate nearby fire and rescue services</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <NearbyPlacesMap placeType="fire_station" hookResult={hookResult} />
      </div>
    </div>
  );
}
