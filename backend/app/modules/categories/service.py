from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.calendar.service import list_upcoming_calendar_event_occurrences
from app.modules.categories.schemas import CategoryOverviewRead
from app.modules.dashboard.schemas import DashboardWeeklyTaskRead
from app.modules.notes.models import Note
from app.modules.tasks.models import DailyTask, WeeklyTaskCompletion
from app.modules.tasks.schemas import weekdays_from_storage
from app.modules.tasks.service import (
    get_active_task_category_or_404,
    list_recurring_tasks_scheduled_for_date,
)


def get_category_overview(
    db: Session,
    category_id: int,
    selected_date: date,
    recent_notes_limit: int = 5,
    upcoming_events_limit: int = 5,
) -> CategoryOverviewRead:
    category = get_active_task_category_or_404(db, category_id)
    daily_tasks = list(
        db.scalars(
            select(DailyTask)
            .where(
                DailyTask.task_date == selected_date,
                DailyTask.category_id == category.id,
                DailyTask.is_completed.is_(False),
                DailyTask.is_archived.is_(False),
            )
            .order_by(
                DailyTask.planned_time.asc().nulls_last(),
                DailyTask.id.asc(),
            )
        )
    )

    recurring_templates = list_recurring_tasks_scheduled_for_date(
        db,
        selected_date,
        category.id,
    )
    recurring_task_ids = [task.id for task in recurring_templates]
    completions_by_task_id: dict[int, WeeklyTaskCompletion] = {}
    if recurring_task_ids:
        completions = db.scalars(
            select(WeeklyTaskCompletion).where(
                WeeklyTaskCompletion.weekly_task_id.in_(recurring_task_ids),
                WeeklyTaskCompletion.completion_date == selected_date,
            )
        )
        completions_by_task_id = {
            completion.weekly_task_id: completion for completion in completions
        }

    recurring_tasks = [
        DashboardWeeklyTaskRead(
            id=task.id,
            title=task.title,
            description=task.description,
            weekdays=weekdays_from_storage(task.weekdays),
            recurrence_type=task.recurrence_type,
            interval_weeks=task.interval_weeks,
            anchor_date=task.anchor_date,
            day_of_month=task.day_of_month,
            start_date=task.start_date,
            end_date=task.end_date,
            category_id=task.category_id,
            is_completed=task.id in completions_by_task_id,
            completion_id=completions_by_task_id.get(task.id).id
            if task.id in completions_by_task_id
            else None,
            is_archived=task.is_archived,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )
        for task in recurring_templates
    ]

    upcoming_events = list_upcoming_calendar_event_occurrences(
        db,
        selected_date,
        limit=upcoming_events_limit,
        category_id=category.id,
    )
    recent_notes = list(
        db.scalars(
            select(Note)
            .where(
                Note.category_id == category.id,
                Note.is_archived.is_(False),
            )
            .order_by(Note.updated_at.desc(), Note.id.desc())
            .limit(recent_notes_limit)
        )
    )

    return CategoryOverviewRead(
        selected_date=selected_date,
        category=category,
        daily_tasks=daily_tasks,
        recurring_tasks=recurring_tasks,
        upcoming_events=upcoming_events,
        recent_notes=recent_notes,
    )
