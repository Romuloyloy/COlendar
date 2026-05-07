from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.dashboard.schemas import (
    DashboardCounts,
    DashboardSummary,
    DashboardWeeklyTaskRead,
)
from app.modules.calendar.service import upcoming_events_query
from app.modules.notes.models import Note
from app.modules.tasks.models import DailyTask, WeeklyTask, WeeklyTaskCompletion
from app.modules.tasks.schemas import weekdays_from_storage
from app.modules.tracker.service import get_tracker_summary


def get_dashboard_summary(
    db: Session,
    selected_date: date,
    recent_notes_limit: int = 5,
    upcoming_events_limit: int = 5,
) -> DashboardSummary:
    daily_tasks = list(
        db.scalars(
            select(DailyTask)
            .where(
                DailyTask.task_date == selected_date,
                DailyTask.is_archived.is_(False),
            )
            .order_by(DailyTask.is_completed.asc(), DailyTask.id.asc())
        )
    )

    scheduled_weekday = selected_date.weekday()
    active_weekly_tasks = list(
        db.scalars(
            select(WeeklyTask)
            .where(WeeklyTask.is_archived.is_(False))
            .order_by(WeeklyTask.id.asc())
        )
    )
    scheduled_weekly_tasks = [
        task
        for task in active_weekly_tasks
        if scheduled_weekday in weekdays_from_storage(task.weekdays)
    ]

    weekly_task_ids = [task.id for task in scheduled_weekly_tasks]
    completions_by_task_id: dict[int, WeeklyTaskCompletion] = {}
    if weekly_task_ids:
        completions = db.scalars(
            select(WeeklyTaskCompletion).where(
                WeeklyTaskCompletion.weekly_task_id.in_(weekly_task_ids),
                WeeklyTaskCompletion.completion_date == selected_date,
            )
        )
        completions_by_task_id = {
            completion.weekly_task_id: completion for completion in completions
        }

    weekly_tasks = [
        DashboardWeeklyTaskRead(
            id=task.id,
            title=task.title,
            description=task.description,
            weekdays=weekdays_from_storage(task.weekdays),
            is_completed=task.id in completions_by_task_id,
            completion_id=completions_by_task_id.get(task.id).id
            if task.id in completions_by_task_id
            else None,
            is_archived=task.is_archived,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )
        for task in scheduled_weekly_tasks
    ]

    recent_notes = list(
        db.scalars(
            select(Note)
            .where(Note.is_archived.is_(False))
            .order_by(Note.updated_at.desc(), Note.id.desc())
            .limit(recent_notes_limit)
        )
    )
    upcoming_events = list(
        db.scalars(upcoming_events_query(selected_date).limit(upcoming_events_limit))
    )
    tracker_summary = get_tracker_summary(db, selected_date)

    return DashboardSummary(
        selected_date=selected_date,
        daily_tasks=daily_tasks,
        weekly_tasks=weekly_tasks,
        upcoming_events=upcoming_events,
        tracker_summary=tracker_summary,
        recent_notes=recent_notes,
        counts=DashboardCounts(
            daily_task_count=len(daily_tasks),
            incomplete_daily_task_count=sum(
                1 for task in daily_tasks if not task.is_completed
            ),
            weekly_task_count=len(weekly_tasks),
            incomplete_weekly_task_count=sum(
                1 for task in weekly_tasks if not task.is_completed
            ),
            recent_note_count=len(recent_notes),
            upcoming_event_count=len(upcoming_events),
            total_water_ml=tracker_summary.total_water_ml,
            activity_count=tracker_summary.activity_count,
            total_calories_kcal=tracker_summary.total_calories_kcal,
        ),
    )
