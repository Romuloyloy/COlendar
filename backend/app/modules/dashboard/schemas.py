from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.modules.calendar.schemas import CalendarEventRead
from app.modules.notes.schemas import NoteRead
from app.modules.tasks.schemas import DailyTaskRead
from app.modules.tracker.schemas import TrackerSummary


class DashboardWeeklyTaskRead(BaseModel):
    id: int
    title: str
    description: str
    weekdays: list[int]
    is_completed: bool
    completion_id: int | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime


class DashboardCounts(BaseModel):
    daily_task_count: int
    incomplete_daily_task_count: int
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
    weekly_tasks: list[DashboardWeeklyTaskRead]
    upcoming_events: list[CalendarEventRead]
    tracker_summary: TrackerSummary
    recent_notes: list[NoteRead]
    counts: DashboardCounts

    model_config = ConfigDict(from_attributes=True)
