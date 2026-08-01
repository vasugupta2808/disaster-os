"use client";

import { NearbyPlacesMap } from "@/components/maps/nearby-places-map";
import { useNearbyPlaces } from "@/lib/hooks/use-nearby-places";

export default function SheltersPage() {
  const hookResult = useNearbyPlaces("shelter");
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-4">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Shelters</h1>
          <p className="text-sm text-muted-foreground mt-1">Find and route to emergency shelters near you</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <NearbyPlacesMap placeType="shelter" hookResult={hookResult} />
      </div>
    </div>
  );
}
