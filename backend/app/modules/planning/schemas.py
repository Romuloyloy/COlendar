from datetime import date

from pydantic import BaseModel

from app.modules.calendar.schemas import CalendarEventRead
from app.modules.tasks.schemas import DailyTaskRead


class PlanningWeeklyTaskOccurrence(BaseModel):
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


class DailyPlan(BaseModel):
    selected_date: date
    daily_tasks: list[DailyTaskRead]
    weekly_tasks: list[PlanningWeeklyTaskOccurrence]
    calendar_events: list[CalendarEventRead]


class WeeklyPlanDay(BaseModel):
    date: date
    daily_tasks: list[DailyTaskRead]
    weekly_tasks: list[PlanningWeeklyTaskOccurrence]
    calendar_events: list[CalendarEventRead]


class WeeklyPlan(BaseModel):
    selected_date: date
    week_start: date
    week_end: date
    days: list[WeeklyPlanDay]
