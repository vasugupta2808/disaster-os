"""
SOS router — 5 endpoints covering the full SOS lifecycle.

User endpoints (require Firebase auth):
  POST   /api/v1/sos          — create a new SOS
  DELETE /api/v1/sos/{id}     — cancel own SOS
  GET    /api/v1/sos/me       — get current user's active SOS (if any)

Admin endpoints (require auth + ADMIN_UIDS membership):
  GET    /api/v1/sos/admin/all            — list all SOS requests
  PATCH  /api/v1/sos/admin/{id}/status    — update any SOS's status
"""

from fastapi import APIRouter, Depends

from app.core.admin import require_admin
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.sos import SosCreateRequest, SosResponse, SosUpdateStatusRequest
from app.services import sos_service

router = APIRouter()


@router.post("", response_model=SosResponse, response_model_by_alias=True, status_code=201)
async def create_sos(
    payload: SosCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SosResponse:
    return await sos_service.create_sos(uid=current_user.uid, payload=payload)


@router.delete("/{sos_id}", response_model=SosResponse, response_model_by_alias=True)
async def cancel_sos(
    sos_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SosResponse:
    return await sos_service.cancel_sos(sos_id=sos_id, uid=current_user.uid)


@router.get("/me", response_model=SosResponse | None, response_model_by_alias=True)
async def get_my_active_sos(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SosResponse | None:
    return await sos_service.get_my_active_sos(uid=current_user.uid)


@router.get("/admin/all", response_model=list[SosResponse], response_model_by_alias=True)
async def list_all_sos(
    admin: AuthenticatedUser = Depends(require_admin),
) -> list[SosResponse]:
    return await sos_service.list_all_sos()


@router.patch(
    "/admin/{sos_id}/status",
    response_model=SosResponse,
    response_model_by_alias=True,
)
async def update_sos_status(
    sos_id: str,
    payload: SosUpdateStatusRequest,
    admin: AuthenticatedUser = Depends(require_admin),
) -> SosResponse:
    return await sos_service.update_sos_status(
        sos_id=sos_id, admin_uid=admin.uid, payload=payload
    )
