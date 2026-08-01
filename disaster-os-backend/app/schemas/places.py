"""
Schemas for the Maps feature: nearby places (shelters, hospitals, police,
fire stations) and directions/routing.

Every schema here inherits CamelCaseModel (app/schemas/base.py), not just
the response ones - unlike disaster_analysis.py's GeminiDisasterAnalysisOutput
(which is purely internal, never touches JSON), every schema in THIS file
either comes from or goes to the frontend, so all of them need camelCase
JSON to match normal TypeScript convention on the other end.

Why a generic NearbyPlace instead of reusing disaster_analysis.py's
ShelterRecommendation: that schema is named and scoped specifically for
the disaster-analysis feature's contract with Gemini's output. This Maps
feature is a different consumer (the Shelters/Hospitals/Police/Fire-
Stations pages, called directly by the user, not assembled alongside an
AI response) and covers four place types, not one - giving it its own
schema keeps each feature's contract independently evolvable.
"""

from enum import StrEnum

from pydantic import Field

from app.schemas.base import CamelCaseModel


class PlaceType(StrEnum):
    """The four nearby-place categories this app supports. Deliberately
    a closed set (not a free-text Google Places type string) so the
    frontend's nav, icons, and copy can map 1:1 onto exactly these four
    values."""

    SHELTER = "shelter"
    HOSPITAL = "hospital"
    POLICE = "police"
    FIRE_STATION = "fire_station"


class NearbyPlace(CamelCaseModel):
    place_id: str
    name: str
    address: str
    latitude: float
    longitude: float
    distance_km: float | None = None
    phone_number: str | None = None
    open_now: bool | None = None


class NearbyPlacesRequest(CamelCaseModel):
    """Query params, not a JSON body - this endpoint is a GET (see
    app/routers/places.py), so this schema exists for internal
    validation/typing only, not as a request body model."""

    place_type: PlaceType
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_meters: float = Field(default=5000, ge=100, le=50000)
    max_results: int = Field(default=10, ge=1, le=20)


class NearbyPlacesResponse(CamelCaseModel):
    place_type: PlaceType
    places: list[NearbyPlace]


class DirectionsRequest(CamelCaseModel):
    origin_latitude: float = Field(..., ge=-90, le=90)
    origin_longitude: float = Field(..., ge=-180, le=180)
    destination_latitude: float = Field(..., ge=-90, le=90)
    destination_longitude: float = Field(..., ge=-180, le=180)


class DirectionsStep(CamelCaseModel):
    instruction_html: str
    distance_meters: int
    duration_seconds: int


class DirectionsResult(CamelCaseModel):
    """Result of a Directions API call. `polyline` is Google's encoded
    polyline format (a compact string), not a list of coordinates - the
    frontend decodes it directly using the Maps JS SDK's own
    geometry library, so we pass it through unmodified rather than
    decoding and re-encoding it server-side for no benefit.
    """

    distance_meters: int
    duration_seconds: int
    polyline: str
    steps: list[DirectionsStep]
    destination_name: str
    destination_address: str


class SafeRouteRequest(CamelCaseModel):
    """'Safe Route' (per our current, honestly-scoped definition):
    standard driving/walking directions to the NEAREST verified shelter
    from the user's current location - not hazard-avoidance routing,
    which would require fire/flood zone data we don't have integrated
    yet. See disaster_analysis.py's ShelterRecommendation docstring for
    the same "never invent, always real data" principle applied here.
    """

    origin_latitude: float = Field(..., ge=-90, le=90)
    origin_longitude: float = Field(..., ge=-180, le=180)
