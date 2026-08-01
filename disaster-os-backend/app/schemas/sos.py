"""
Schemas for the SOS Emergency System.

The Firestore document shape is also documented here as a comment
(not enforced by Pydantic since Firestore has no schema enforcement)
so there's one canonical source of truth for what a Firestore
sos_requests/{sosId} document looks like.

Firestore document: sos_requests/{sosId}
    uid: str                    # Firebase UID of the sender
    status: str                 # pending | active | resolved | cancelled
    severity: str               # critical | high | medium
    situation: str              # user's description
    latitude: float
    longitude: float
    location_label: str         # reverse-geocoded or fallback string
    created_at: Timestamp
    updated_at: Timestamp
    resolved_by: str | None     # admin UID who resolved/cancelled
    resolution_note: str | None # optional note from admin
"""

from typing import Literal

from pydantic import Field

from app.schemas.base import CamelCaseModel

SosStatus = Literal["pending", "active", "resolved", "cancelled"]
SosSeverity = Literal["critical", "high", "medium"]


class SosCreateRequest(CamelCaseModel):
    situation: str = Field(..., min_length=1, max_length=2000)
    severity: SosSeverity
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    location_label: str = Field(default="Unknown location", max_length=200)


class SosUpdateStatusRequest(CamelCaseModel):
    """Admin-only: update the status of an SOS request."""
    status: SosStatus
    resolution_note: str | None = Field(default=None, max_length=500)


class SosResponse(CamelCaseModel):
    """Full SOS request as returned by the API — mirrors the Firestore
    document shape, with Timestamps converted to ISO 8601 strings."""
    id: str
    uid: str
    status: SosStatus
    severity: SosSeverity
    situation: str
    latitude: float
    longitude: float
    location_label: str
    created_at: str    # ISO 8601
    updated_at: str    # ISO 8601
    resolved_by: str | None
    resolution_note: str | None
