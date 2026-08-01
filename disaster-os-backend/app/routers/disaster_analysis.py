"""
Disaster analysis router - HTTP layer only, business logic lives in
app/services/disaster_analysis_service.py.

Unlike chat, this is a normal request/response endpoint (no streaming) -
the output is structured data meant to be rendered as UI (badges, lists,
cards), not prose meant to be read as it arrives.
"""

from fastapi import APIRouter, Depends

from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.disaster_analysis import DisasterAnalysisRequest, DisasterAnalysisResult
from app.services import disaster_analysis_service

router = APIRouter()


@router.post("", response_model=DisasterAnalysisResult, response_model_by_alias=True)
async def analyze_disaster_situation(
    payload: DisasterAnalysisRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DisasterAnalysisResult:
    """Classifies a disaster situation, assesses urgency, generates
    emergency instructions and relevant emergency numbers, and (if
    location was provided) attaches real nearby shelter recommendations.
    """
    return await disaster_analysis_service.analyze_situation(payload)
