from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.calendar.schemas import CalendarEventRead
from app.modules.notes.schemas import NoteRead
from app.modules.tasks.schemas import DailyTaskRead
from app.modules.tracker.schemas import TrackerSummary


class DashboardWeeklyTaskRead(BaseModel):
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
    category_id: int | None
    is_completed: bool
    completion_id: int | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime


class DashboardCounts(BaseModel):
    daily_task_count: int
    incomplete_daily_task_count: int
    open_daily_task_count: int
    weekly_task_count: int
    incomplete_weekly_task_count: int
    recent_note_count: int
    upcoming_event_count: int
    total_water_ml: int
    activity_count: int
    total_calories_kcal: int


class DashboardSummary(BaseModel):
    selected_date: date
    daily_tasks: list[DailyTaskRead]
    open_daily_tasks: list[DailyTaskRead]
    weekly_tasks: list[DashboardWeeklyTaskRead]
    upcoming_events: list[CalendarEventRead]
    tracker_summary: TrackerSummary
    recent_notes: list[NoteRead]
    counts: DashboardCounts

    model_config = ConfigDict(from_attributes=True)


class DashboardWidgetPreferenceRead(BaseModel):
    id: int
    widget_key: str
    sort_order: int
    is_visible: bool
    config_json: dict
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardWidgetPreferenceUpdate(BaseModel):
    widget_key: str = Field(min_length=1, max_length=100)
    is_visible: bool = True
    config_json: dict = Field(default_factory=dict)

    @field_validator("widget_key")
    @classmethod
    def widget_key_cannot_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Widget key cannot be empty")
        return value.strip()


class DashboardWidgetLayoutRead(BaseModel):
    widgets: list[DashboardWidgetPreferenceRead]


class DashboardWidgetLayoutUpdate(BaseModel):
    widgets: list[DashboardWidgetPreferenceUpdate]

    @field_validator("widgets")
    @classmethod
    def widget_keys_must_be_unique(
        cls,
        value: list[DashboardWidgetPreferenceUpdate],
    ) -> list[DashboardWidgetPreferenceUpdate]:
        widget_keys = [widget.widget_key for widget in value]
        if len(widget_keys) != len(set(widget_keys)):
            raise ValueError("Dashboard widget keys must be unique")
        return value
