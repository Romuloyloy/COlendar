from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.tasks.models import DailyTask, TaskCategory, WeeklyTask
from app.modules.tasks.schemas import (
    validate_recurrence_fields,
    weekdays_from_storage,
    weekdays_to_storage,
)


def get_active_daily_task_or_404(db: Session, task_id: int) -> DailyTask:
    task = db.scalar(
        select(DailyTask).where(
            DailyTask.id == task_id,
            DailyTask.is_archived.is_(False),
        )
    )
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Daily task not found",
        )
    return task


def get_active_weekly_task_or_404(db: Session, task_id: int) -> WeeklyTask:
    task = db.scalar(
        select(WeeklyTask).where(
            WeeklyTask.id == task_id,
            WeeklyTask.is_archived.is_(False),
        )
    )
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weekly task not found",
        )
    return task


def get_active_task_category_or_404(db: Session, category_id: int) -> TaskCategory:
    category = db.scalar(
        select(TaskCategory).where(
            TaskCategory.id == category_id,
            TaskCategory.is_archived.is_(False),
        )
    )
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task category not found",
        )
    return category


def validate_optional_category(db: Session, category_id: int | None) -> None:
    if category_id is not None:
        get_active_task_category_or_404(db, category_id)


def validate_unique_active_category_name(
    db: Session,
    name: str,
    category_id: int | None = None,
) -> None:
    normalized_name = name.strip().lower()
    categories = db.scalars(
        select(TaskCategory).where(TaskCategory.is_archived.is_(False))
    )
    for category in categories:
        if category.id != category_id and category.name.strip().lower() == normalized_name:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Task category name already exists",
            )


def validate_weekly_completion_date(task: WeeklyTask, completion_date: date) -> None:
    if not is_recurring_task_scheduled_on_date(task, completion_date):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completion date is not an occurrence date for this recurring task",
        )


def validate_recurring_task_values(
    *,
    recurrence_type: str,
    weekdays: list[int],
    anchor_date: date | None,
    day_of_month: int | None,
    start_date: date | None,
    end_date: date | None,
) -> None:
    try:
        validate_recurrence_fields(
            recurrence_type=recurrence_type,
            weekdays=weekdays,
            anchor_date=anchor_date,
            day_of_month=day_of_month,
            start_date=start_date,
            end_date=end_date,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


def recurrence_interval_for(recurrence_type: str) -> int:
    return 2 if recurrence_type == "biweekly" else 1


def normalized_weekday_storage(recurrence_type: str, weekdays: list[int]) -> str:
    if recurrence_type == "monthly_day":
        return ""
    return weekdays_to_storage(weekdays)


def is_recurring_task_scheduled_on_date(task: WeeklyTask, selected_date: date) -> bool:
    if task.end_date is not None and selected_date > task.end_date:
        return False
    if task.start_date is not None and selected_date < task.start_date:
        return False

    if task.recurrence_type == "monthly_day":
        return task.day_of_month == selected_date.day

    weekdays = weekdays_from_storage(task.weekdays)
    if selected_date.weekday() not in weekdays:
        return False

    if task.recurrence_type == "biweekly":
        if task.anchor_date is None or selected_date < task.anchor_date:
            return False
        anchor_week_start = task.anchor_date.toordinal() - task.anchor_date.weekday()
        selected_week_start = selected_date.toordinal() - selected_date.weekday()
        weeks_since_anchor = (selected_week_start - anchor_week_start) // 7
        return weeks_since_anchor >= 0 and weeks_since_anchor % 2 == 0

    return True


def list_recurring_tasks_scheduled_for_date(
    db: Session,
    selected_date: date,
    category_id: int | None = None,
) -> list[WeeklyTask]:
    validate_optional_category(db, category_id)
    query = select(WeeklyTask).where(WeeklyTask.is_archived.is_(False))
    if category_id is not None:
        query = query.where(WeeklyTask.category_id == category_id)
    tasks = list(db.scalars(query.order_by(WeeklyTask.id.asc())))
    return [
        task for task in tasks if is_recurring_task_scheduled_on_date(task, selected_date)
    ]
