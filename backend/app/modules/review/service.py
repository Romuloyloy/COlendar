from datetime import date, timedelta

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.modules.calendar.service import list_calendar_events_for_date
from app.modules.dashboard.schemas import DashboardWeeklyTaskRead
from app.modules.notes.models import Note
from app.modules.planning.service import (
    list_daily_tasks_for_date,
    week_start_for,
)
from app.modules.review.schemas import (
    ReviewCategorySummary,
    ReviewDailySummary,
    ReviewSummary,
    ReviewTaskCounts,
    ReviewTrackerTotals,
    ReviewWeeklyDaySummary,
    ReviewWeeklySummary,
    ReviewWeeklyTotals,
)
from app.modules.tasks.models import DailyTask, TaskCategory
from app.modules.tasks.models import WeeklyTaskCompletion
from app.modules.tasks.schemas import weekdays_from_storage
from app.modules.tasks.service import list_recurring_tasks_scheduled_for_date
from app.modules.tracker.service import get_tracker_summary


def get_review_summary(db: Session, selected_date: date) -> ReviewSummary:
    week_start = week_start_for(selected_date)
    week_end = week_start + timedelta(days=6)
    daily = _daily_summary(db, selected_date)
    weekly = _weekly_summary(db, week_start)

    return ReviewSummary(
        selected_date=selected_date,
        week_start=week_start,
        week_end=week_end,
        daily=daily,
        weekly=weekly,
        categories=_category_summaries(db, week_start, week_end),
    )


def _daily_summary(db: Session, selected_date: date) -> ReviewDailySummary:
    daily_tasks = list_daily_tasks_for_date(db, selected_date)
    recurring_tasks = _recurring_task_reads(db, selected_date)
    calendar_events = list_calendar_events_for_date(db, selected_date)
    notes = _notes_touched_on_date(db, selected_date)
    tracker_summary = get_tracker_summary(db, selected_date)

    return ReviewDailySummary(
        date=selected_date,
        daily_tasks=daily_tasks,
        recurring_tasks=recurring_tasks,
        calendar_events=calendar_events,
        notes=notes,
        tracker_summary=tracker_summary,
        counts=_task_counts(daily_tasks, recurring_tasks),
    )


def _weekly_summary(db: Session, week_start: date) -> ReviewWeeklySummary:
    days = [
        _weekly_day_summary(db, week_start + timedelta(days=offset))
        for offset in range(7)
    ]
    tracker_totals = ReviewTrackerTotals(
        total_water_ml=sum(day.tracker.total_water_ml for day in days),
        total_calories_kcal=sum(day.tracker.total_calories_kcal for day in days),
        activity_count=sum(day.tracker.activity_count for day in days),
        total_activity_minutes=sum(
            day.tracker.total_activity_minutes for day in days
        ),
    )

    return ReviewWeeklySummary(
        week_start=week_start,
        week_end=week_start + timedelta(days=6),
        days=days,
        totals=ReviewWeeklyTotals(
            completed_daily_tasks=sum(day.completed_daily_tasks for day in days),
            incomplete_daily_tasks=sum(day.incomplete_daily_tasks for day in days),
            completed_recurring_tasks=sum(
                day.completed_recurring_tasks for day in days
            ),
            incomplete_recurring_tasks=sum(
                day.incomplete_recurring_tasks for day in days
            ),
            event_count=sum(day.event_count for day in days),
            note_count=sum(day.note_count for day in days),
            tracker=tracker_totals,
        ),
    )


def _weekly_day_summary(db: Session, selected_date: date) -> ReviewWeeklyDaySummary:
    daily_tasks = list_daily_tasks_for_date(db, selected_date)
    recurring_tasks = _recurring_task_reads(db, selected_date)
    tracker_summary = get_tracker_summary(db, selected_date)

    return ReviewWeeklyDaySummary(
        date=selected_date,
        completed_daily_tasks=sum(task.is_completed for task in daily_tasks),
        incomplete_daily_tasks=sum(not task.is_completed for task in daily_tasks),
        completed_recurring_tasks=sum(task.is_completed for task in recurring_tasks),
        incomplete_recurring_tasks=sum(
            not task.is_completed for task in recurring_tasks
        ),
        event_count=len(list_calendar_events_for_date(db, selected_date)),
        note_count=len(_notes_touched_on_date(db, selected_date)),
        tracker=ReviewTrackerTotals(
            total_water_ml=tracker_summary.total_water_ml,
            total_calories_kcal=tracker_summary.total_calories_kcal,
            activity_count=tracker_summary.activity_count,
            total_activity_minutes=tracker_summary.total_activity_minutes,
        ),
    )


def _task_counts(
    daily_tasks: list[DailyTask],
    recurring_tasks: list[DashboardWeeklyTaskRead],
) -> ReviewTaskCounts:
    return ReviewTaskCounts(
        completed_daily_tasks=sum(task.is_completed for task in daily_tasks),
        incomplete_daily_tasks=sum(not task.is_completed for task in daily_tasks),
        completed_recurring_tasks=sum(task.is_completed for task in recurring_tasks),
        incomplete_recurring_tasks=sum(
            not task.is_completed for task in recurring_tasks
        ),
    )


def _recurring_task_reads(
    db: Session,
    selected_date: date,
) -> list[DashboardWeeklyTaskRead]:
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
        for task in scheduled_tasks
    ]


def _notes_touched_on_date(db: Session, selected_date: date) -> list[Note]:
    return list(
        db.scalars(
            select(Note)
            .where(
                Note.is_archived.is_(False),
                or_(
                    func.date(Note.created_at) == selected_date,
                    func.date(Note.updated_at) == selected_date,
                ),
            )
            .order_by(Note.updated_at.desc(), Note.id.desc())
        )
    )


def _category_summaries(
    db: Session,
    week_start: date,
    week_end: date,
) -> list[ReviewCategorySummary]:
    categories = list(
        db.scalars(
            select(TaskCategory)
            .where(TaskCategory.is_archived.is_(False))
            .order_by(TaskCategory.name.asc(), TaskCategory.id.asc())
        )
    )

    summaries = []
    for category in categories:
        summaries.append(
            ReviewCategorySummary(
                category=category,
                daily_task_count=_category_daily_task_count(
                    db,
                    category.id,
                    week_start,
                    week_end,
                ),
                recurring_task_occurrence_count=_category_recurring_count(
                    db,
                    category.id,
                    week_start,
                ),
                note_count=_category_note_count(db, category.id),
                event_count=sum(
                    len(
                        list_calendar_events_for_date(
                            db,
                            week_start + timedelta(days=offset),
                            category.id,
                        )
                    )
                    for offset in range(7)
                ),
            )
        )
    return summaries


def _category_daily_task_count(
    db: Session,
    category_id: int,
    week_start: date,
    week_end: date,
) -> int:
    return (
        db.scalar(
            select(func.count(DailyTask.id)).where(
                DailyTask.category_id == category_id,
                DailyTask.task_date >= week_start,
                DailyTask.task_date <= week_end,
                DailyTask.is_archived.is_(False),
            )
        )
        or 0
    )


def _category_recurring_count(db: Session, category_id: int, week_start: date) -> int:
    return sum(
        len(
            list_recurring_tasks_scheduled_for_date(
                db,
                week_start + timedelta(days=offset),
                category_id,
            )
        )
        for offset in range(7)
    )


def _category_note_count(db: Session, category_id: int) -> int:
    return (
        db.scalar(
            select(func.count(Note.id)).where(
                Note.category_id == category_id,
                Note.is_archived.is_(False),
            )
        )
        or 0
    )
