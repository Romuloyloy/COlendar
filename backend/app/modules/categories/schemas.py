from datetime import date

from pydantic import BaseModel, ConfigDict

from app.modules.calendar.schemas import CalendarEventRead
from app.modules.dashboard.schemas import DashboardWeeklyTaskRead
from app.modules.notes.schemas import NoteRead
from app.modules.tasks.schemas import DailyTaskRead, TaskCategoryRead


class CategoryOverviewRead(BaseModel):
    selected_date: date
    category: TaskCategoryRead
    daily_tasks: list[DailyTaskRead]
    recurring_tasks: list[DashboardWeeklyTaskRead]
    upcoming_events: list[CalendarEventRead]
    recent_notes: list[NoteRead]

    model_config = ConfigDict(from_attributes=True)
