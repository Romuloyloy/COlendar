from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.tasks.models import DailyTask, WeeklyTask
from app.modules.tasks.schemas import weekdays_from_storage


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


def validate_weekly_completion_date(task: WeeklyTask, completion_date) -> None:
    if completion_date.weekday() not in weekdays_from_storage(task.weekdays):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completion date is not one of this weekly task's weekdays",
        )
