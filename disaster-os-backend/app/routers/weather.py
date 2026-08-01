"""
Weather router - HTTP layer only, business logic in
app/services/weather_service.py.

GET with query params (not POST with a body) since this is a read-only
lookup parameterized by location - matches REST convention and matches
exactly what lib/api/weather.ts on the frontend already calls.

`response_model_by_alias=True` is REQUIRED here (and on every router
that returns a CamelCaseModel-derived schema) - without it, FastAPI
serializes using the Python snake_case field names instead of the
camelCase aliases, silently defeating the entire point of
app/schemas/base.py's CamelCaseModel.
"""

from fastapi import APIRouter, Depends, Query

from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.weather import WeatherSnapshot
from app.services import weather_service

router = APIRouter()


@router.get("/snapshot", response_model=WeatherSnapshot, response_model_by_alias=True)
async def get_weather_snapshot(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> WeatherSnapshot:
    return await weather_service.get_weather_snapshot(latitude=lat, longitude=lon)
