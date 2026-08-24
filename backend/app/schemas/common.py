from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, field_serializer


def utc_json(value: datetime) -> str:
    return value.isoformat(timespec="seconds") + "Z"


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    @field_serializer("*", when_used="json", check_fields=False)
    def serialize_datetime_fields(self, value: Any) -> Any:
        return utc_json(value) if isinstance(value, datetime) else value
