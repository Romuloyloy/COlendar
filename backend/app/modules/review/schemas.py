from datetime import date

from pydantic import BaseModel

from app.modules.calendar.schemas import CalendarEventRead
from app.modules.dashboard.schemas import DashboardWeeklyTaskRead
from app.modules.notes.schemas import NoteRead
from app.modules.tasks.schemas import DailyTaskRead, TaskCategoryRead
from app.modules.tracker.schemas import TrackerSummary


class ReviewTaskCounts(BaseModel):
    completed_daily_tasks: int
    incomplete_daily_tasks: int
    completed_recurring_tasks: int
    incomplete_recurring_tasks: int


class ReviewDailySummary(BaseModel):
    date: date
    daily_tasks: list[DailyTaskRead]
    recurring_tasks: list[DashboardWeeklyTaskRead]
    calendar_events: list[CalendarEventRead]
    notes: list[NoteRead]
    tracker_summary: TrackerSummary
    counts: ReviewTaskCounts


class ReviewTrackerTotals(BaseModel):
    total_water_ml: int
    total_calories_kcal: int
    activity_count: int
    total_activity_minutes: int


class ReviewWeeklyDaySummary(BaseModel):
    date: date
    completed_daily_tasks: int
    incomplete_daily_tasks: int
    completed_recurring_tasks: int
    incomplete_recurring_tasks: int
    event_count: int
    note_count: int
    tracker: ReviewTrackerTotals


class ReviewWeeklyTotals(BaseModel):
    completed_daily_tasks: int
    incomplete_daily_tasks: int
    completed_recurring_tasks: int
    incomplete_recurring_tasks: int
    event_count: int
    note_count: int
    tracker: ReviewTrackerTotals


class ReviewWeeklySummary(BaseModel):
    week_start: date
    week_end: date
    days: list[ReviewWeeklyDaySummary]
    totals: ReviewWeeklyTotals


class ReviewCategorySummary(BaseModel):
    category: TaskCategoryRead
    daily_task_count: int
    recurring_task_occurrence_count: int
    note_count: int
    event_count: int


class ReviewSummary(BaseModel):
    selected_date: date
    week_start: date
    week_end: date
    daily: ReviewDailySummary
    weekly: ReviewWeeklySummary
    categories: list[ReviewCategorySummary]
