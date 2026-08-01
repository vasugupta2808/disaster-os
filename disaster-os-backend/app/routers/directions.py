"""
Directions router - HTTP layer for two related but distinct endpoints:

1. POST /directions - general point-to-point directions (origin +
   explicit destination), used by the "Directions" feature.
2. POST /safe-route - directions to the NEAREST verified shelter from
   the user's current location, used by the "Safe Route" feature.

Why these are two endpoints and not one with an optional destination:
Safe Route's destination is computed server-side (nearest shelter via
places_service), while general Directions takes an explicit destination
from the caller. Conflating them into one endpoint with conditional
logic would make the request schema ambiguous about which mode is being
used - two clear, single-purpose endpoints are simpler to reason about
and document.
"""

from fastapi import APIRouter, Depends

from app.core.exceptions import NotFoundError
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.places import DirectionsRequest, DirectionsResult, SafeRouteRequest
from app.services import directions_service, places_service

router = APIRouter()


@router.post("/directions", response_model=DirectionsResult, response_model_by_alias=True)
async def get_directions(
    payload: DirectionsRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DirectionsResult:
    return await directions_service.get_directions(
        origin_latitude=payload.origin_latitude,
        origin_longitude=payload.origin_longitude,
        destination_latitude=payload.destination_latitude,
        destination_longitude=payload.destination_longitude,
        destination_name="Destination",
        destination_address="",
    )


@router.post("/safe-route", response_model=DirectionsResult, response_model_by_alias=True)
async def get_safe_route(
    payload: SafeRouteRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DirectionsResult:
    """Finds the nearest verified shelter to the user's current location,
    then computes real directions to it. 'Safe' here means "routes to a
    verified safe destination", NOT hazard-avoidance routing - see
    SafeRouteRequest's docstring for why that distinction matters and is
    deliberate, not a missing feature we're hiding.
    """
    shelters = await places_service.find_nearby_shelters(
        latitude=payload.origin_latitude,
        longitude=payload.origin_longitude,
        max_results=1,
    )
    if not shelters:
        raise NotFoundError("No verified shelter could be found near your location.")

    nearest = shelters[0]
    return await directions_service.get_directions(
        origin_latitude=payload.origin_latitude,
        origin_longitude=payload.origin_longitude,
        destination_latitude=nearest.latitude,
        destination_longitude=nearest.longitude,
        destination_name=nearest.name,
        destination_address=nearest.address,
    )
