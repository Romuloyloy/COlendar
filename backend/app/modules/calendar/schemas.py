from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class CalendarEventBase(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    description: str = ""
    event_date: date
    start_time: time | None = None
    end_time: time | None = None
    location: str = Field(default="", max_length=250)

    @field_validator("title")
    @classmethod
    def title_cannot_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Event title cannot be empty")
        return value

    @model_validator(mode="after")
    def end_time_cannot_be_before_start_time(self) -> "CalendarEventBase":
        if (
            self.start_time is not None
            and self.end_time is not None
            and self.end_time < self.start_time
        ):
            raise ValueError("Event end time cannot be before start time")
        return self


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=250)
    description: str | None = None
    event_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    location: str | None = Field(default=None, max_length=250)

    @field_validator("title")
    @classmethod
    def title_cannot_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Event title cannot be empty")
        return value


class CalendarEventRead(BaseModel):
    id: int
    title: str
    description: str
    event_date: date
    start_time: time | None
    end_time: time | None
    location: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
