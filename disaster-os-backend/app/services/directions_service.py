"""
Google Directions API service.

Uses the Routes API (Google's current-generation directions service,
successor to the legacy Directions API) via direct REST calls, same
httpx + tenacity pattern as places_service.py, for the same reasons
(async-native, consistent with the rest of this codebase).
"""

import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.exceptions import ExternalServiceError
from app.schemas.places import DirectionsResult, DirectionsStep

logger = structlog.get_logger(__name__)

_ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4))
async def get_directions(
    *,
    origin_latitude: float,
    origin_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
    destination_name: str,
    destination_address: str,
    travel_mode: str = "DRIVE",
) -> DirectionsResult:
    """Computes a route between two points using the Routes API.

    `destination_name`/`destination_address` are passed in by the caller
    (already known from a prior Places lookup) rather than re-derived
    here - this function's only job is the route geometry/timing, not
    place metadata it doesn't need to re-fetch.
    """
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_MAPS_SERVER_API_KEY,
        # Field mask is REQUIRED by the Routes API, same as Places (New).
        # We request only the route-level fields we actually use -
        # polyline for map rendering, duration/distance for display, and
        # per-step instructions for a turn-by-turn list.
        "X-Goog-FieldMask": (
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,"
            "routes.legs.steps.localizedValues,routes.legs.steps.navigationInstruction,"
            "routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration"
        ),
    }
    body = {
        "origin": {
            "location": {
                "latLng": {"latitude": origin_latitude, "longitude": origin_longitude}
            }
        },
        "destination": {
            "location": {
                "latLng": {"latitude": destination_latitude, "longitude": destination_longitude}
            }
        },
        "travelMode": travel_mode,
        "polylineQuality": "HIGH_QUALITY",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(_ROUTES_API_URL, json=body, headers=headers)
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError as exc:
        logger.error("directions_api_request_failed", exc_info=exc)
        raise ExternalServiceError(
            "Could not calculate a route right now. Please try again."
        ) from exc

    routes = payload.get("routes", [])
    if not routes:
        raise ExternalServiceError("No route could be found to that destination.")

    route = routes[0]
    polyline = route.get("polyline", {}).get("encodedPolyline", "")

    steps: list[DirectionsStep] = []
    for leg in route.get("legs", []):
        for step in leg.get("steps", []):
            instruction = step.get("navigationInstruction", {}).get("instructions", "")
            steps.append(
                DirectionsStep(
                    instruction_html=instruction,
                    distance_meters=step.get("distanceMeters", 0),
                    duration_seconds=_parse_duration_seconds(step.get("staticDuration", "0s")),
                )
            )

    return DirectionsResult(
        distance_meters=route.get("distanceMeters", 0),
        duration_seconds=_parse_duration_seconds(route.get("duration", "0s")),
        polyline=polyline,
        steps=steps,
        destination_name=destination_name,
        destination_address=destination_address,
    )


def _parse_duration_seconds(duration_str: str) -> int:
    """The Routes API returns durations as strings like '123s', not
    numbers - this parses that format. Falls back to 0 rather than
    raising on an unexpected format, since a wrong/missing duration
    shouldn't take down the whole route response."""
    try:
        return int(duration_str.rstrip("s"))
    except (ValueError, AttributeError):
        return 0
