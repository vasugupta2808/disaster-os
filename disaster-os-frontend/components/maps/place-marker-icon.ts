/**
 * Custom SVG marker icons for Google Maps.
 *
 * Returns a google.maps.Icon config object for each PlaceType.
 * Colors are hand-matched to our design tokens:
 * - Shelter: indigo (primary)
 * - Hospital: green (severity-low, positive/safe)
 * - Police: blue (severity-info)
 * - Fire Station: orange-red (severity-high, urgency)
 * - User location: a pulsing blue dot (built separately in the map
 *   component using a GroundOverlay or CircleMarker, not this function)
 */

import type { PlaceType } from "@/types/maps";

const ICON_COLORS: Record<PlaceType, string> = {
  shelter: "#4f46e5",     // indigo - primary brand
  hospital: "#16a34a",   // green - safe/medical
  police: "#2563eb",     // blue - authority/info
  fire_station: "#ea580c", // orange-red - urgency
};

export function getMarkerIcon(placeType: PlaceType, selected = false): google.maps.Icon {
  const color = ICON_COLORS[placeType];
  const size = selected ? 44 : 36;

  // SVG circle-pin marker: filled circle on top of a small triangle
  // pointing down, same shape as Google Maps' own pin for consistency.
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 44 52">
      <circle cx="22" cy="20" r="${selected ? 18 : 16}"
        fill="${color}" stroke="white" stroke-width="${selected ? 3 : 2}" />
      <polygon points="22,48 14,32 30,32"
        fill="${color}" />
    </svg>
  `.trim();

  const encoded = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

  return {
    url: encoded,
    scaledSize: new google.maps.Size(size, size + 8),
    anchor: new google.maps.Point(size / 2, size + 8),
  };
}

export function getUserLocationIcon(): google.maps.Icon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" fill="#4f46e5" stroke="white" stroke-width="2" opacity="0.9"/>
      <circle cx="12" cy="12" r="12" fill="#4f46e5" opacity="0.2"/>
    </svg>
  `.trim();
  const encoded = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  return {
    url: encoded,
    scaledSize: new google.maps.Size(24, 24),
    anchor: new google.maps.Point(12, 12),
  };
}
