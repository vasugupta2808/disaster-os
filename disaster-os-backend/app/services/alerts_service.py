"""
Disaster alerts service - fetches from ReliefWeb and OpenWeather's
severe weather alerts, normalizes both into our single DisasterAlert
shape, and merges them into one feed.

Why merge two genuinely different APIs into one function: ReliefWeb
covers humanitarian/disaster REPORTS (often after the fact, global,
slower-moving), while OpenWeather's alerts are active, location-specific
severe weather warnings (faster-moving, narrower). A user wants "what's
relevant right now" as one feed, not two separately-shaped lists to
mentally merge themselves.

NASA FIRMS (fire detection) is intentionally NOT included here - it's
marked optional in the original feature spec, returns raw fire-detection
points rather than alert-shaped data, and deserves its own dedicated
treatment (likely on a map, not a text feed) rather than being forced
into this shape. Flagged here so the gap is deliberate, not silently
missing.
"""

import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.exceptions import ExternalServiceError
from app.schemas.alerts import DisasterAlert

logger = structlog.get_logger(__name__)

_RELIEFWEB_REPORTS_URL = "https://api.reliefweb.int/v1/disasters"
_OPENWEATHER_ALERTS_URL = "https://api.openweathermap.org/data/2.5/onecall"

# OpenWeather's severe-weather alert "event" strings don't map to our
# five-value severity scale on their own - this is our judgment call on
# how to bucket them, documented here rather than left implicit.
_OPENWEATHER_EVENT_SEVERITY: dict[str, str] = {
    "Tornado Warning": "critical",
    "Tsunami Warning": "critical",
    "Extreme Wind Warning": "critical",
    "Flash Flood Warning": "high",
    "Severe Thunderstorm Warning": "high",
    "Hurricane Warning": "high",
    "Flood Warning": "high",
    "Winter Storm Warning": "medium",
    "Heat Advisory": "medium",
    "Wind Advisory": "low",
}
_DEFAULT_OPENWEATHER_SEVERITY = "medium"

# ReliefWeb disaster "status" doesn't carry urgency directly - we treat
# "alert" status (ReliefWeb's own term for a freshly-declared event) as
# higher severity than "ongoing" or "past", as a reasonable proxy.
_RELIEFWEB_STATUS_SEVERITY: dict[str, str] = {
    "alert": "high",
    "current": "medium",
    "past": "info",
}


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, min=0.5, max=3))
async def _fetch_reliefweb_alerts(limit: int) -> tuple[list[DisasterAlert], bool]:
    """Returns (alerts, fetch_succeeded). The bool lets the caller tell
    "this source had nothing to report" apart from "this source's
    request failed" - those are very different situations and must not
    both collapse into an empty list."""
    params: dict[str, str | int | list[str]] = {
        "appname": settings.RELIEFWEB_APP_NAME,
        "limit": limit,
        "sort[]": "date:desc",
        "fields[include][]": ["name", "status", "date", "url", "country"],
    }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(_RELIEFWEB_REPORTS_URL, params=params)
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError as exc:
        # ReliefWeb failing should not take down the whole alerts feed -
        # OpenWeather alerts can still be useful on their own. Log and
        # report failure (not "no alerts") so the caller can distinguish
        # this from a genuinely quiet news day.
        logger.warning("reliefweb_request_failed", exc_info=exc)
        return [], False

    alerts: list[DisasterAlert] = []
    for item in payload.get("data", []):
        fields = item.get("fields", {})
        status = fields.get("status", "current")
        country_names = ", ".join(c.get("name", "") for c in fields.get("country", []))
        alerts.append(
            DisasterAlert(
                id=f"reliefweb-{item.get('id')}",
                title=fields.get("name", "Disaster report"),
                description=f"Status: {status.capitalize()}",
                severity=_RELIEFWEB_STATUS_SEVERITY.get(status, "info"),
                source="reliefweb",
                location_label=country_names or "Unknown location",
                published_at=fields.get("date", {}).get("created", ""),
                url=fields.get("url"),
            )
        )
    return alerts, True


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, min=0.5, max=3))
async def _fetch_openweather_alerts(
    latitude: float, longitude: float
) -> tuple[list[DisasterAlert], bool]:
    """Returns (alerts, fetch_succeeded) - same reasoning as
    _fetch_reliefweb_alerts above."""
    params: dict[str, str | float] = {
        "lat": latitude,
        "lon": longitude,
        "appid": settings.OPENWEATHER_API_KEY,
        "exclude": "minutely,hourly,daily,current",
    }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(_OPENWEATHER_ALERTS_URL, params=params)
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError as exc:
        # Same reasoning as ReliefWeb above - one source failing
        # shouldn't break the whole feed.
        logger.warning("openweather_alerts_request_failed", exc_info=exc)
        return [], False

    alerts: list[DisasterAlert] = []
    for entry in payload.get("alerts", []):
        event = entry.get("event", "Weather Alert")
        alerts.append(
            DisasterAlert(
                id=f"openweather-{entry.get('sender_name', 'unknown')}-{entry.get('start')}",
                title=event,
                description=entry.get("description", "")[:500],  # Cap length for feed display.
                severity=_OPENWEATHER_EVENT_SEVERITY.get(event, _DEFAULT_OPENWEATHER_SEVERITY),
                source="openweather",
                location_label=entry.get("sender_name", "Local weather service"),
                published_at=str(entry.get("start", "")),
                url=None,
            )
        )
    return alerts, True


async def get_disaster_alerts(
    *,
    latitude: float | None,
    longitude: float | None,
    limit: int = 20,
) -> list[DisasterAlert]:
    """Merges ReliefWeb (global disaster reports) with OpenWeather
    severe-weather alerts (location-specific, only fetched if
    coordinates are provided) into one feed, most recent first.
    """
    reliefweb_alerts, reliefweb_ok = await _fetch_reliefweb_alerts(limit)

    openweather_alerts: list[DisasterAlert] = []
    openweather_ok = True  # Vacuously true if we never attempted the call.
    if latitude is not None and longitude is not None:
        openweather_alerts, openweather_ok = await _fetch_openweather_alerts(latitude, longitude)

    if not reliefweb_ok and not openweather_ok:
        # Both sources actually FAILED (not just "had nothing to
        # report") - this is a real external-service problem worth
        # surfacing, distinct from a genuinely quiet news day where both
        # calls succeed and correctly return zero alerts.
        raise ExternalServiceError(
            "Could not retrieve disaster alerts right now. Please try again."
        )

    combined = openweather_alerts + reliefweb_alerts
    combined.sort(key=lambda a: a.published_at, reverse=True)
    return combined[:limit]
