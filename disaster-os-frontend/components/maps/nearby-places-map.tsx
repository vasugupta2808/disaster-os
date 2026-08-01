"use client";

import {
  DirectionsRenderer,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { AnimatePresence } from "framer-motion";
import { LocateFixed, RefreshCw, Shield } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { DirectionsPanel } from "@/components/maps/directions-panel";
import { PlacesList } from "@/components/maps/places-list";
import { getMarkerIcon, getUserLocationIcon } from "@/components/maps/place-marker-icon";
import { FullScreenLoader } from "@/components/shared/full-screen-loader";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/config/env";
import { getSafeRoute } from "@/lib/api/places";
import { ApiError, NetworkError } from "@/lib/api/client";
import type { UseNearbyPlacesResult } from "@/lib/hooks/use-nearby-places";
import type { PlaceType } from "@/types/maps";

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1b2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8fa8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1b2e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2f47" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212337" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3d3f5e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f1729" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const LIBRARIES: ("geometry" | "places")[] = ["geometry", "places"];

export function NearbyPlacesMap({
  placeType,
  hookResult,
}: {
  placeType: PlaceType;
  hookResult: UseNearbyPlacesResult;
}) {
  const {
    places, placesLoading, placesError, selectedPlace,
    directions, directionsLoading, directionsError,
    userLatitude, userLongitude, locationLoading, locationError,
    selectPlace, fetchDirections, refetch,
  } = hookResult;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY,
    libraries: LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [safeRouteResult, setSafeRouteResult] = useState<google.maps.DirectionsResult | null>(null);
  const [safeRouteLoading, setSafeRouteLoading] = useState(false);
  const [safeRouteError, setSafeRouteError] = useState<string | null>(null);
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);

  useEffect(() => {
    if (!isLoaded || !directions || !selectedPlace || userLatitude === null || userLongitude === null) {
      setDirectionsResult(null);
      return;
    }
    const svc = new google.maps.DirectionsService();
    svc.route(
      {
        origin: { lat: userLatitude, lng: userLongitude },
        destination: { lat: selectedPlace.latitude, lng: selectedPlace.longitude },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) setDirectionsResult(result);
      },
    );
  }, [isLoaded, directions, selectedPlace, userLatitude, userLongitude]);

  const handleSafeRoute = useCallback(async () => {
    if (userLatitude === null || userLongitude === null || !isLoaded || places.length === 0) return;
    setSafeRouteLoading(true);
    setSafeRouteError(null);
    try {
      await getSafeRoute({ originLatitude: userLatitude, originLongitude: userLongitude });
      const nearest = places[0];
      if (!nearest) return;
      const svc = new google.maps.DirectionsService();
      svc.route(
        {
          origin: { lat: userLatitude, lng: userLongitude },
          destination: { lat: nearest.latitude, lng: nearest.longitude },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) setSafeRouteResult(result);
        },
      );
    } catch (err) {
      setSafeRouteError(
        err instanceof NetworkError || err instanceof ApiError ? err.message : "Could not calculate safe route.",
      );
    } finally {
      setSafeRouteLoading(false);
    }
  }, [userLatitude, userLongitude, isLoaded, places]);

  const handleRecenter = useCallback(() => {
    if (mapRef.current && userLatitude !== null && userLongitude !== null) {
      mapRef.current.panTo({ lat: userLatitude, lng: userLongitude });
      mapRef.current.setZoom(14);
    }
  }, [userLatitude, userLongitude]);

  if (loadError) return (
    <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
      Could not load Google Maps. Check your API key configuration.
    </div>
  );

  if (locationLoading || !isLoaded) return <FullScreenLoader label="Getting your location..." />;

  if (locationError || userLatitude === null || userLongitude === null) return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm text-muted-foreground">{locationError ?? "Could not determine your location."}</p>
      <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
    </div>
  );

  const center = { lat: userLatitude, lng: userLongitude };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-3 lg:flex-row">
      <div className="relative flex-1 overflow-hidden rounded-xl border border-border">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={center}
          zoom={14}
          options={{ styles: DARK_MAP_STYLE, disableDefaultUI: true, zoomControl: true, gestureHandling: "greedy" }}
          onLoad={(map) => { mapRef.current = map; }}
        >
          <Marker position={center} icon={getUserLocationIcon()} title="Your location" zIndex={1000} />
          {places.map((place) => (
            <Marker
              key={place.placeId}
              position={{ lat: place.latitude, lng: place.longitude }}
              icon={getMarkerIcon(placeType, selectedPlace?.placeId === place.placeId)}
              title={place.name}
              onClick={() => selectPlace(place)}
              zIndex={selectedPlace?.placeId === place.placeId ? 100 : 10}
            />
          ))}
          {directionsResult && (
            <DirectionsRenderer
              directions={directionsResult}
              options={{ suppressMarkers: true, polylineOptions: { strokeColor: "#4f46e5", strokeWeight: 4, strokeOpacity: 0.85 } }}
            />
          )}
          {safeRouteResult && (
            <DirectionsRenderer
              directions={safeRouteResult}
              options={{ suppressMarkers: true, polylineOptions: { strokeColor: "#16a34a", strokeWeight: 4, strokeOpacity: 0.85 } }}
            />
          )}
        </GoogleMap>
        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          <Button size="icon" variant="secondary" onClick={handleRecenter} title="Center on my location" className="shadow-md">
            <LocateFixed className="h-4 w-4" />
          </Button>
          <Button
            size="icon" variant="secondary"
            onClick={() => void handleSafeRoute()}
            disabled={safeRouteLoading || places.length === 0}
            title="Safe route to nearest shelter"
            className="shadow-md"
          >
            <Shield className={`h-4 w-4 ${safeRouteLoading ? "animate-pulse" : ""}`} />
          </Button>
        </div>
        {safeRouteError && (
          <div className="absolute bottom-14 right-3 max-w-xs rounded-lg border border-severity-critical/20 bg-card p-2 text-xs text-severity-critical shadow-lg">
            {safeRouteError}
          </div>
        )}
      </div>

      <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card lg:w-80">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {placesLoading ? "Finding nearby..." : `${places.length} found nearby`}
          </p>
          <Button variant="ghost" size="icon" onClick={refetch} disabled={placesLoading}>
            <RefreshCw className={`h-3.5 w-3.5 ${placesLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedPlace ? (
              <DirectionsPanel
                key="directions"
                place={selectedPlace}
                directions={directions}
                loading={directionsLoading}
                error={directionsError}
                onClose={() => { selectPlace(null); setDirectionsResult(null); }}
                onGetDirections={() => void fetchDirections(selectedPlace)}
              />
            ) : (
              <PlacesList
                key="list"
                places={places}
                loading={placesLoading}
                error={placesError}
                selectedPlace={selectedPlace}
                placeType={placeType}
                onSelect={selectPlace}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
