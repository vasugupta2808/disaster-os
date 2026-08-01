"""
Shared base model for camelCase JSON serialization.

Why this exists: Python/Pydantic convention is snake_case field names
(`disaster_type`, `emergency_numbers`), but TypeScript/JavaScript
convention is camelCase (`disasterType`, `emergencyNumbers`). Every
schema in this app should serialize as camelCase so the frontend gets
JSON that matches normal TS conventions, WITHOUT each individual field
needing a manually-written alias.

This base class uses Pydantic's `alias_generator` to convert every field
automatically at the class level, plus `populate_by_name=True` so the
backend's own Python code can still construct instances using the
Pythonic snake_case names (e.g. `WeatherSnapshot(location_label=...)`)
rather than being forced to use camelCase internally too.

Every schema in app/schemas/ that gets returned directly in an API
response should inherit from this instead of plain pydantic.BaseModel.
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelCaseModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
