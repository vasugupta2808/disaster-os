"""
Schema for the weather snapshot feature.

Inherits CamelCaseModel so the JSON this serializes to
(`locationLabel`, `temperatureCelsius`, ...) matches
types/domain.ts's WeatherSnapshot interface on the frontend exactly.
Internally, Python code in this backend still uses snake_case field
names (location_label, temperature_celsius) - only the JSON wire format
is camelCase.
"""

from app.schemas.base import CamelCaseModel


class WeatherSnapshot(CamelCaseModel):
    location_label: str
    temperature_celsius: float
    condition: str
    risk_note: str | None
    wind_speed_kph: float
    humidity_percent: int
    observed_at: str  # ISO 8601
