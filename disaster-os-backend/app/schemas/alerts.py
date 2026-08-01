"""
Schema for the disaster alerts feature.

Inherits CamelCaseModel for the same reason as weather.py - JSON output
must match types/domain.ts's DisasterAlert interface (camelCase).

`severity` reuses the same string values as disaster_analysis.py's
UrgencyLevel - both ultimately map to the same five-value scale shown
with the same colors throughout the app (see tailwind.config.ts's
`severity` tokens) - but kept as its own Literal here rather than a
shared import, since alerts and disaster-analysis are independent
features that happen to use the same scale, not features that depend on
each other.
"""

from typing import Literal

from app.schemas.base import CamelCaseModel

AlertSeverity = Literal["critical", "high", "medium", "low", "info"]
AlertSource = Literal["reliefweb", "openweather", "nasa_firms"]


class DisasterAlert(CamelCaseModel):
    id: str
    title: str
    description: str
    severity: AlertSeverity
    source: AlertSource
    location_label: str
    published_at: str  # ISO 8601
    url: str | None
