from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class WaterEntryCreate(BaseModel):
    entry_date: date
    amount_ml: int = Field(gt=0)
    note: str = ""


class WaterEntryRead(BaseModel):
    id: int
    entry_date: date
    amount_ml: int
    note: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityEntryCreate(BaseModel):
    entry_date: date
    activity_type: str = Field(min_length=1, max_length=200)
    duration_minutes: int | None = Field(default=None, ge=0)
    quantity: Decimal | None = Field(default=None, ge=0)
    note: str = ""

    @field_validator("activity_type")
    @classmethod
    def activity_type_cannot_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Activity type cannot be empty")
        return value


class ActivityEntryRead(BaseModel):
    id: int
    entry_date: date
    activity_type: str
    duration_minutes: int | None
    quantity: Decimal | None
    note: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TrackerSummary(BaseModel):
    selected_date: date
    water_entries: list[WaterEntryRead]
    activity_entries: list[ActivityEntryRead]
    total_water_ml: int
    activity_count: int
    total_activity_minutes: int
