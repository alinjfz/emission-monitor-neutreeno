"""Shared Pydantic behavior for the public JSON API."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, field_serializer


def utc_json(value: datetime) -> str:
    """Mark the application's naive-but-UTC datetimes explicitly for browsers."""
    return value.isoformat(timespec="seconds") + "Z"


class ApiModel(BaseModel):
    """Base contract that supports ORM objects and consistent UTC serialization."""

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("*", when_used="json", check_fields=False)
    def serialize_datetime_fields(self, value: Any) -> Any:
        """Serialize datetime fields as explicit UTC while leaving other values intact."""
        return utc_json(value) if isinstance(value, datetime) else value
