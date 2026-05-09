from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.calendar.models import CalendarEvent
from app.modules.planning.schemas import (
    DailyPlan,
    PlanningWeeklyTaskOccurrence,
    WeeklyPlan,
    WeeklyPlanDay,
)
from app.modules.tasks.models import DailyTask, WeeklyTaskCompletion
from app.modules.tasks.schemas import weekdays_from_storage
from app.modules.tasks.service import list_recurring_tasks_scheduled_for_date


def week_start_for(selected_date: date) -> date:
    return selected_date - timedelta(days=selected_date.weekday())


def list_daily_tasks_for_date(db: Session, selected_date: date) -> list[DailyTask]:
    return list(
        db.scalars(
            select(DailyTask)
            .where(
                DailyTask.task_date == selected_date,
                DailyTask.is_archived.is_(False),
            )
            .order_by(
                DailyTask.is_completed.asc(),
                DailyTask.planned_time.asc().nulls_last(),
                DailyTask.id.asc(),
            )
        )
    )


def list_calendar_events_for_date(
    db: Session,
    selected_date: date,
) -> list[CalendarEvent]:
    return list(
        db.scalars(
            select(CalendarEvent)
            .where(
                CalendarEvent.event_date == selected_date,
                CalendarEvent.is_archived.is_(False),
            )
            .order_by(
                CalendarEvent.start_time.asc().nulls_last(),
                CalendarEvent.id.asc(),
            )
        )
    )


def list_weekly_task_occurrences_for_date(
    db: Session,
    selected_date: date,
) -> list[PlanningWeeklyTaskOccurrence]:
    scheduled_tasks = list_recurring_tasks_scheduled_for_date(db, selected_date)
    task_ids = [task.id for task in scheduled_tasks]
    completions_by_task_id: dict[int, WeeklyTaskCompletion] = {}
    if task_ids:
        completions = db.scalars(
            select(WeeklyTaskCompletion).where(
                WeeklyTaskCompletion.weekly_task_id.in_(task_ids),
                WeeklyTaskCompletion.completion_date == selected_date,
            )
        )
        completions_by_task_id = {
            completion.weekly_task_id: completion for completion in completions
        }

    return [
        PlanningWeeklyTaskOccurrence(
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
            is_completed=task.id in completions_by_task_id,
            completion_id=completions_by_task_id.get(task.id).id
            if task.id in completions_by_task_id
            else None,
        )
        for task in scheduled_tasks
    ]


def get_daily_plan(db: Session, selected_date: date) -> DailyPlan:
    return DailyPlan(
        selected_date=selected_date,
        daily_tasks=list_daily_tasks_for_date(db, selected_date),
        weekly_tasks=list_weekly_task_occurrences_for_date(db, selected_date),
        calendar_events=list_calendar_events_for_date(db, selected_date),
    )


def get_weekly_plan(db: Session, selected_date: date) -> WeeklyPlan:
    week_start = week_start_for(selected_date)
    days = [
        WeeklyPlanDay(
            date=day,
            daily_tasks=list_daily_tasks_for_date(db, day),
            weekly_tasks=list_weekly_task_occurrences_for_date(db, day),
            calendar_events=list_calendar_events_for_date(db, day),
        )
        for day in (week_start + timedelta(days=offset) for offset in range(7))
    ]
    return WeeklyPlan(
        selected_date=selected_date,
        week_start=week_start,
        week_end=week_start + timedelta(days=6),
        days=days,
    )
