from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.tasks.schemas import DailyTaskRead, normalize_weekdays

VALID_EVENT_RECURRENCE_TYPES = {"none", "weekly", "biweekly", "monthly_day"}


class CalendarEventBase(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    description: str = ""
    event_date: date
    start_time: time | None = None
    end_time: time | None = None
    location: str = Field(default="", max_length=250)
    category_id: int | None = None
    recurrence_type: str = "none"
    weekdays: list[int] = Field(default_factory=list)
    anchor_date: date | None = None
    day_of_month: int | None = Field(default=None, ge=1, le=31)
    recurrence_end_date: date | None = None

    @field_validator("title")
    @classmethod
    def title_cannot_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Event title cannot be empty")
        return value

    @field_validator("weekdays")
    @classmethod
    def weekdays_must_be_valid(cls, value: list[int]) -> list[int]:
        return sorted(set(value))

    @field_validator("recurrence_type")
    @classmethod
    def recurrence_type_must_be_valid(cls, value: str) -> str:
        if value not in VALID_EVENT_RECURRENCE_TYPES:
            raise ValueError(
                "recurrence_type must be none, weekly, biweekly, or monthly_day"
            )
        return value

    @model_validator(mode="after")
    def end_time_cannot_be_before_start_time(self) -> "CalendarEventBase":
        if (
            self.start_time is not None
            and self.end_time is not None
            and self.end_time < self.start_time
        ):
            raise ValueError("Event end time cannot be before start time")
        validate_event_recurrence_fields(
            recurrence_type=self.recurrence_type,
            weekdays=self.weekdays,
            event_date=self.event_date,
            anchor_date=self.anchor_date,
            day_of_month=self.day_of_month,
            recurrence_end_date=self.recurrence_end_date,
        )
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
    category_id: int | None = None
    recurrence_type: str | None = None
    weekdays: list[int] | None = None
    anchor_date: date | None = None
    day_of_month: int | None = Field(default=None, ge=1, le=31)
    recurrence_end_date: date | None = None

    @field_validator("title")
    @classmethod
    def title_cannot_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Event title cannot be empty")
        return value

    @field_validator("weekdays")
    @classmethod
    def weekdays_must_be_valid(cls, value: list[int] | None) -> list[int] | None:
        if value is None:
            return value
        return sorted(set(value))

    @field_validator("recurrence_type")
    @classmethod
    def recurrence_type_must_be_valid(cls, value: str | None) -> str | None:
        if value is not None and value not in VALID_EVENT_RECURRENCE_TYPES:
            raise ValueError(
                "recurrence_type must be none, weekly, biweekly, or monthly_day"
            )
        return value


class CalendarEventRead(BaseModel):
    id: int
    title: str
    description: str
    event_date: date
    start_time: time | None
    end_time: time | None
    location: str
    category_id: int | None
    recurrence_type: str
    weekdays: list[int]
    interval_weeks: int
    anchor_date: date | None
    day_of_month: int | None
    recurrence_end_date: date | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CalendarRecurringTaskOccurrence(BaseModel):
    id: int
    title: str
    description: str
    weekdays: list[int]
    recurrence_type: str
    interval_weeks: int
    anchor_date: date | None
    day_of_month: int | None
    start_date: date | None
    end_date: date | None
    is_completed: bool
    completion_id: int | None


class CalendarOverviewDay(BaseModel):
    date: date
    calendar_events: list[CalendarEventRead]
    daily_tasks: list[DailyTaskRead]
    recurring_tasks: list[CalendarRecurringTaskOccurrence]


class CalendarOverviewRead(BaseModel):
    from_date: date
    to_date: date
    days: list[CalendarOverviewDay]


def validate_event_recurrence_fields(
    *,
    recurrence_type: str,
    weekdays: list[int],
    event_date: date,
    anchor_date: date | None,
    day_of_month: int | None,
    recurrence_end_date: date | None,
) -> None:
    if recurrence_type == "none":
        return
    if recurrence_type in {"weekly", "biweekly"}:
        normalize_weekdays(weekdays)
    if recurrence_type == "biweekly" and anchor_date is None:
        raise ValueError("Bi-weekly events require an anchor date")
    if recurrence_type == "monthly_day" and day_of_month is None:
        raise ValueError("Monthly events require a day of month")

    recurrence_start = anchor_date if recurrence_type == "biweekly" else event_date
    if recurrence_end_date is not None and recurrence_end_date < recurrence_start:
        raise ValueError("recurrence_end_date cannot be before the recurrence start")
