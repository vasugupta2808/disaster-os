/**
 * Dark theme map styles for Google Maps JS SDK.
 *
 * Google Maps doesn't read our CSS variables - map tile styling is
 * configured via this separate JSON style-rules format, applied through
 * the `styles` prop on GoogleMap (see nearby-places-map.tsx). This is a
 * well-known, widely-used "dark mode" style array for Google Maps
 * (muted grays, dark water/land distinction, suppressed default POI
 * clutter) - chosen so default Google Maps icons/labels don't fight
 * visually with our own custom markers and the rest of the app's
 * restrained palette.
 */
export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1d23" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1d23" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8f98" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b8bcc4" }],
  },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#222722" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2d34" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7a7e87" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#2e3138" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#383c45" }] },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a8acb5" }],
  },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2a2d34" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#10141c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e5a6b" }] },
];
