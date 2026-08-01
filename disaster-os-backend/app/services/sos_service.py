"""
SOS service - all Firestore read/write operations for SOS requests.

Why Firestore (not SQLite/Postgres) for SOS: the frontend's SOS status
tracker uses a Firestore onSnapshot listener to receive real-time status
updates (pending → active → resolved) the instant an admin changes them,
without polling. That real-time push model is exactly what Firestore is
built for. SQLite/Postgres would require polling, which adds latency at
exactly the moment (an active emergency) where latency matters most.

All WRITES go through this service (via the Admin SDK, which bypasses
Firestore Security Rules). The frontend's Firestore client SDK only does
READS (onSnapshot listeners) - this is the architectural boundary we
established at the project's start and maintained throughout.
"""

from datetime import UTC, datetime
from typing import Any

import structlog
from google.cloud.firestore import SERVER_TIMESTAMP

from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.firebase import get_firestore_client
from app.schemas.sos import SosCreateRequest, SosResponse, SosUpdateStatusRequest

logger = structlog.get_logger(__name__)

_COLLECTION = "sos_requests"


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _doc_to_response(doc_id: str, data: dict[str, Any]) -> SosResponse:
    """Converts a Firestore document dict to a SosResponse, handling
    Firestore Timestamp → ISO 8601 string conversion."""
    def ts_to_iso(val: object) -> str:
        if hasattr(val, "isoformat"):
            return val.isoformat()  # type: ignore[no-any-return]
        if hasattr(val, "timestamp"):
            return datetime.fromtimestamp(val.timestamp(), tz=UTC).isoformat()
        return str(val)

    return SosResponse(
        id=doc_id,
        uid=data.get("uid", ""),
        status=data.get("status", "pending"),
        severity=data.get("severity", "high"),
        situation=data.get("situation", ""),
        latitude=data.get("latitude", 0.0),
        longitude=data.get("longitude", 0.0),
        location_label=data.get("location_label", "Unknown location"),
        created_at=ts_to_iso(data.get("created_at", _now_iso())),
        updated_at=ts_to_iso(data.get("updated_at", _now_iso())),
        resolved_by=data.get("resolved_by"),
        resolution_note=data.get("resolution_note"),
    )


async def create_sos(*, uid: str, payload: SosCreateRequest) -> SosResponse:
    """Creates a new SOS request in Firestore with status=pending."""
    db = get_firestore_client()
    doc_ref = db.collection(_COLLECTION).document()

    doc_data = {
        "uid": uid,
        "status": "pending",
        "severity": payload.severity,
        "situation": payload.situation,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "location_label": payload.location_label,
        "created_at": SERVER_TIMESTAMP,
        "updated_at": SERVER_TIMESTAMP,
        "resolved_by": None,
        "resolution_note": None,
    }

    doc_ref.set(doc_data)
    logger.info("sos_created", sos_id=doc_ref.id, uid=uid, severity=payload.severity)

    # Re-fetch the document so the SERVER_TIMESTAMP fields are resolved
    # to actual timestamps for the response, rather than returning a
    # sentinel value the frontend can't display.
    doc = doc_ref.get()
    return _doc_to_response(doc_ref.id, doc.to_dict() or {})


async def cancel_sos(*, sos_id: str, uid: str) -> SosResponse:
    """Cancels an SOS request. Only the owner can cancel their own SOS."""
    db = get_firestore_client()
    doc_ref = db.collection(_COLLECTION).document(sos_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise NotFoundError(f"SOS request {sos_id} not found.")

    data = doc.to_dict() or {}
    if data.get("uid") != uid:
        raise ForbiddenError("You can only cancel your own SOS request.")

    if data.get("status") in ("resolved", "cancelled"):
        raise ForbiddenError(
            f"Cannot cancel an SOS that is already {data.get('status')}."
        )

    doc_ref.update({"status": "cancelled", "updated_at": SERVER_TIMESTAMP})
    logger.info("sos_cancelled", sos_id=sos_id, uid=uid)

    updated = doc_ref.get()
    return _doc_to_response(sos_id, updated.to_dict() or {})


async def get_my_active_sos(*, uid: str) -> SosResponse | None:
    """Returns the user's most recent non-resolved SOS, or None if they
    have no active SOS. Used by the frontend to decide whether to show
    the send form or the status tracker on page load."""
    db = get_firestore_client()
    query = (
        db.collection(_COLLECTION)
        .where("uid", "==", uid)
        .where("status", "in", ["pending", "active"])
        .order_by("created_at", direction="DESCENDING")
        .limit(1)
    )
    docs = query.stream()
    for doc in docs:
        return _doc_to_response(doc.id, doc.to_dict() or {})
    return None


async def list_all_sos(*, limit: int = 50) -> list[SosResponse]:
    """Admin-only: returns all SOS requests, most recent first."""
    db = get_firestore_client()
    query = (
        db.collection(_COLLECTION)
        .order_by("created_at", direction="DESCENDING")
        .limit(limit)
    )
    return [_doc_to_response(doc.id, doc.to_dict() or {}) for doc in query.stream()]


async def update_sos_status(
    *, sos_id: str, admin_uid: str, payload: SosUpdateStatusRequest
) -> SosResponse:
    """Admin-only: updates the status of any SOS request."""
    db = get_firestore_client()
    doc_ref = db.collection(_COLLECTION).document(sos_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise NotFoundError(f"SOS request {sos_id} not found.")

    update_data: dict[str, Any] = {
        "status": payload.status,
        "updated_at": SERVER_TIMESTAMP,
    }
    if payload.status in ("resolved", "cancelled"):
        update_data["resolved_by"] = admin_uid
    if payload.resolution_note is not None:
        update_data["resolution_note"] = payload.resolution_note

    doc_ref.update(update_data)
    logger.info("sos_status_updated", sos_id=sos_id, new_status=payload.status, admin=admin_uid)

    updated = doc_ref.get()
    return _doc_to_response(sos_id, updated.to_dict() or {})
