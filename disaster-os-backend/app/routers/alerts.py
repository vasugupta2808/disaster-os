"""
Alerts router - HTTP layer only, business logic in
app/services/alerts_service.py.
"""

from fastapi import APIRouter, Depends, Query

from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.alerts import DisasterAlert
from app.services import alerts_service

router = APIRouter()


@router.get("", response_model=list[DisasterAlert], response_model_by_alias=True)
async def list_disaster_alerts(
    lat: float | None = Query(default=None, ge=-90, le=90),
    lon: float | None = Query(default=None, ge=-180, le=180),
    limit: int = Query(default=20, ge=1, le=50),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[DisasterAlert]:
    return await alerts_service.get_disaster_alerts(latitude=lat, longitude=lon, limit=limit)
