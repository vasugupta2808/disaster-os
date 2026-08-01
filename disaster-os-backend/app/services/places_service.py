"""
Google Places API service.

Why httpx + raw REST calls instead of the official `googlemaps` Python
package: that package is sync-only, which would block our async event
loop on every call. The Places API (New) is a straightforward REST API,
and we already depend on httpx + tenacity for exactly this kind of
external call - adding a second, sync-only HTTP client just for Maps
would be inconsistent with the rest of this codebase for no real benefit.

This file now backs two distinct features:
1. `find_nearby_shelters()` - the original, narrow function used by
   disaster_analysis_service.py, returning ShelterRecommendation objects.
   Left untouched so that feature's contract doesn't shift underneath it.
2. `find_nearby_places()` - the generalized version added for the Maps
   feature (Shelters/Hospitals/Police/Fire-Stations pages), returning the
   generic NearbyPlace shape and supporting all four PlaceType values.

Both call the same low-level `_nearby_search()` helper - the only thing
that differs between place types is which Google Places "type" strings
we search for.
"""

import math
from typing import Any

import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.exceptions import ExternalServiceError
from app.schemas.disaster_analysis import ShelterRecommendation
from app.schemas.places import NearbyPlace, PlaceType

logger = structlog.get_logger(__name__)

_PLACES_NEARBY_SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby"

# Google Places doesn't have a literal "shelter" place type. "Emergency
# shelter" in practice maps best to community/civic buildings that
# realistically serve as shelters - community centers and local
# government offices are the closest available types. This is a
# pragmatic mapping, not a perfect one - flagged here rather than left
# implicit, since "why does a city hall show up as a shelter" is a fair
# question this comment answers.
_SHELTER_PLACE_TYPES = ["community_center", "local_government_office"]

# Google Places (New) type strings for the other three categories - these
# ARE literal, documented Places types (unlike shelter above), so no
# approximation needed here.
_PLACE_TYPE_TO_GOOGLE_TYPES: dict[PlaceType, list[str]] = {
    PlaceType.SHELTER: _SHELTER_PLACE_TYPES,
    PlaceType.HOSPITAL: ["hospital"],
    PlaceType.POLICE: ["police"],
    PlaceType.FIRE_STATION: ["fire_station"],
}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two coordinates, in kilometers.
    Used to compute `distance_km` on each result so the frontend can sort
    or display "2.3 km away" without making its own API call just for
    that number."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4))
async def _nearby_search(
    *,
    latitude: float,
    longitude: float,
    included_types: list[str],
    radius_meters: float = 5000,
    max_results: int = 5,
) -> list[dict[str, Any]]:
    """Low-level Places API (New) Nearby Search call. Shared by every
    "find nearby X" feature (shelters now; hospitals/fire-stations later)
    - they differ only in `included_types`.
    """
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_MAPS_SERVER_API_KEY,
        # Field mask is REQUIRED by the Places API (New) - without it the
        # API returns an error. Includes everything either consumer
        # (ShelterRecommendation or the generic NearbyPlace) uses;
        # unused fields are simply ignored by whichever caller doesn't
        # need them, which is simpler than maintaining two field masks.
        "X-Goog-FieldMask": (
            "places.displayName,places.formattedAddress,places.location,places.id,"
            "places.nationalPhoneNumber,places.currentOpeningHours.openNow"
        ),
    }
    body = {
        "includedTypes": included_types,
        "maxResultCount": max_results,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": latitude, "longitude": longitude},
                "radius": radius_meters,
            }
        },
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(_PLACES_NEARBY_SEARCH_URL, json=body, headers=headers)
            response.raise_for_status()
            return response.json().get("places", [])  # type: ignore[no-any-return]
    except httpx.HTTPError as exc:
        logger.error("places_api_request_failed", exc_info=exc)
        raise ExternalServiceError(
            "Could not look up nearby locations right now. Please try again."
        ) from exc


async def find_nearby_shelters(
    *,
    latitude: float,
    longitude: float,
    max_results: int = 5,
) -> list[ShelterRecommendation]:
    """Public entry point used by disaster_analysis_service.py.

    Returns real Places results, never AI-generated ones - this is the
    function that backs the contract described in
    ShelterRecommendation's docstring: Gemini never invents shelters.
    """
    raw_places = await _nearby_search(
        latitude=latitude,
        longitude=longitude,
        included_types=_SHELTER_PLACE_TYPES,
        max_results=max_results,
    )

    results: list[ShelterRecommendation] = []
    for place in raw_places:
        location = place.get("location", {})
        place_lat = location.get("latitude")
        place_lon = location.get("longitude")
        if place_lat is None or place_lon is None:
            continue  # Skip malformed entries rather than crash on a bad API response.

        results.append(
            ShelterRecommendation(
                name=place.get("displayName", {}).get("text", "Unnamed location"),
                address=place.get("formattedAddress", "Address unavailable"),
                latitude=place_lat,
                longitude=place_lon,
                distance_km=round(_haversine_km(latitude, longitude, place_lat, place_lon), 1),
                place_id=place.get("id"),
            )
        )

    return sorted(results, key=lambda s: s.distance_km or float("inf"))


async def find_nearby_places(
    *,
    place_type: PlaceType,
    latitude: float,
    longitude: float,
    radius_meters: float = 5000,
    max_results: int = 10,
) -> list[NearbyPlace]:
    """Public entry point for the Maps feature (Shelters/Hospitals/
    Police/Fire-Stations pages) - generic across all four PlaceType
    values, unlike find_nearby_shelters() above which is narrowly typed
    for the disaster-analysis feature's contract.
    """
    google_types = _PLACE_TYPE_TO_GOOGLE_TYPES[place_type]

    raw_places = await _nearby_search(
        latitude=latitude,
        longitude=longitude,
        included_types=google_types,
        radius_meters=radius_meters,
        max_results=max_results,
    )

    results: list[NearbyPlace] = []
    for place in raw_places:
        location = place.get("location", {})
        place_lat = location.get("latitude")
        place_lon = location.get("longitude")
        if place_lat is None or place_lon is None:
            continue  # Skip malformed entries rather than crash on a bad API response.

        opening_hours = place.get("currentOpeningHours") or {}

        results.append(
            NearbyPlace(
                place_id=place.get("id", ""),
                name=place.get("displayName", {}).get("text", "Unnamed location"),
                address=place.get("formattedAddress", "Address unavailable"),
                latitude=place_lat,
                longitude=place_lon,
                distance_km=round(_haversine_km(latitude, longitude, place_lat, place_lon), 1),
                phone_number=place.get("nationalPhoneNumber"),
                open_now=opening_hours.get("openNow"),
            )
        )

    return sorted(results, key=lambda p: p.distance_km or float("inf"))
