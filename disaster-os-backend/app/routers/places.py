"""
Places router - HTTP layer only, business logic in
app/services/places_service.py (find_nearby_places, already built and
generalized across all four PlaceType values).

One endpoint, parameterized by `type`, rather than four separate
endpoints (/shelters, /hospitals, /police, /fire-stations) - the
underlying query is identical except for which Google Places types it
searches, so a single parameterized route avoids four near-duplicate
handlers that would need to be kept in sync by hand.
"""

from fastapi import APIRouter, Depends, Query

from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.places import NearbyPlace, PlaceType
from app.services import places_service

router = APIRouter()


@router.get("/nearby", response_model=list[NearbyPlace], response_model_by_alias=True)
async def get_nearby_places(
    type: PlaceType = Query(..., description="shelter | hospital | police | fire_station"),
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius: float = Query(default=5000, ge=100, le=50000, description="Search radius in meters"),
    limit: int = Query(default=10, ge=1, le=20),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[NearbyPlace]:
    return await places_service.find_nearby_places(
        place_type=type,
        latitude=lat,
        longitude=lon,
        radius_meters=radius,
        max_results=limit,
    )
