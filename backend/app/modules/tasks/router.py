from datetime import date

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.tasks.models import DailyTask, WeeklyTask, WeeklyTaskCompletion
from app.modules.tasks.schemas import (
    DailyTaskCreate,
    DailyTaskRead,
    DailyTaskUpdate,
    WeeklyTaskCompletionRead,
    WeeklyTaskCreate,
    WeeklyTaskRead,
    WeeklyTaskUpdate,
    weekdays_from_storage,
    weekdays_to_storage,
)
from app.modules.tasks.service import (
    get_active_daily_task_or_404,
    get_active_weekly_task_or_404,
    validate_weekly_completion_date,
)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def serialize_weekly_task(task: WeeklyTask) -> WeeklyTaskRead:
    return WeeklyTaskRead(
        id=task.id,
        title=task.title,
        description=task.description,
        weekdays=weekdays_from_storage(task.weekdays),
        is_archived=task.is_archived,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.get("/daily", response_model=list[DailyTaskRead])
def list_daily_tasks(
    date: date = Query(...),
    db: Session = Depends(get_db),
) -> list[DailyTask]:
    return list(
        db.scalars(
            select(DailyTask)
            .where(DailyTask.task_date == date, DailyTask.is_archived.is_(False))
            .order_by(DailyTask.is_completed.asc(), DailyTask.id.asc())
        )
    )


@router.post("/daily", response_model=DailyTaskRead, status_code=status.HTTP_201_CREATED)
def create_daily_task(payload: DailyTaskCreate, db: Session = Depends(get_db)) -> DailyTask:
    task = DailyTask(
        title=payload.title.strip(),
        description=payload.description,
        task_date=payload.task_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/daily/{task_id}", response_model=DailyTaskRead)
def update_daily_task(
    task_id: int,
    payload: DailyTaskUpdate,
    db: Session = Depends(get_db),
) -> DailyTask:
    task = get_active_daily_task_or_404(db, task_id)

    if "title" in payload.model_fields_set and payload.title is not None:
        task.title = payload.title.strip()
    if "description" in payload.model_fields_set and payload.description is not None:
        task.description = payload.description
    if "task_date" in payload.model_fields_set and payload.task_date is not None:
        task.task_date = payload.task_date

    db.commit()
    db.refresh(task)
    return task


@router.delete("/daily/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_daily_task(task_id: int, db: Session = Depends(get_db)) -> Response:
    task = get_active_daily_task_or_404(db, task_id)
    task.is_archived = True
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/daily/{task_id}/complete", response_model=DailyTaskRead)
def complete_daily_task(task_id: int, db: Session = Depends(get_db)) -> DailyTask:
    task = get_active_daily_task_or_404(db, task_id)
    if not task.is_completed:
        task.is_completed = True
        task.completed_at = func.now()
        db.commit()
        db.refresh(task)
    return task


@router.post("/daily/{task_id}/incomplete", response_model=DailyTaskRead)
def incomplete_daily_task(task_id: int, db: Session = Depends(get_db)) -> DailyTask:
    task = get_active_daily_task_or_404(db, task_id)
    if task.is_completed:
        task.is_completed = False
        task.completed_at = None
        db.commit()
        db.refresh(task)
    return task


@router.get("/weekly", response_model=list[WeeklyTaskRead])
def list_weekly_tasks(
    weekday: int | None = Query(default=None, ge=0, le=6),
    db: Session = Depends(get_db),
) -> list[WeeklyTaskRead]:
    tasks = list(
        db.scalars(
            select(WeeklyTask)
            .where(WeeklyTask.is_archived.is_(False))
            .order_by(WeeklyTask.id.asc())
        )
    )
    if weekday is not None:
        tasks = [task for task in tasks if weekday in weekdays_from_storage(task.weekdays)]
    return [serialize_weekly_task(task) for task in tasks]


@router.get("/weekly/completions", response_model=list[WeeklyTaskCompletionRead])
def list_weekly_task_completions(
    completion_date: date = Query(...),
    db: Session = Depends(get_db),
) -> list[WeeklyTaskCompletion]:
    return list(
        db.scalars(
            select(WeeklyTaskCompletion)
            .join(WeeklyTask)
            .where(
                WeeklyTaskCompletion.completion_date == completion_date,
                WeeklyTask.is_archived.is_(False),
            )
            .order_by(WeeklyTaskCompletion.weekly_task_id.asc())
        )
    )


@router.post("/weekly", response_model=WeeklyTaskRead, status_code=status.HTTP_201_CREATED)
def create_weekly_task(
    payload: WeeklyTaskCreate,
    db: Session = Depends(get_db),
) -> WeeklyTaskRead:
    task = WeeklyTask(
        title=payload.title.strip(),
        description=payload.description,
        weekdays=weekdays_to_storage(payload.weekdays),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return serialize_weekly_task(task)


@router.patch("/weekly/{task_id}", response_model=WeeklyTaskRead)
def update_weekly_task(
    task_id: int,
    payload: WeeklyTaskUpdate,
    db: Session = Depends(get_db),
) -> WeeklyTaskRead:
    task = get_active_weekly_task_or_404(db, task_id)

    if "title" in payload.model_fields_set and payload.title is not None:
        task.title = payload.title.strip()
    if "description" in payload.model_fields_set and payload.description is not None:
        task.description = payload.description
    if "weekdays" in payload.model_fields_set and payload.weekdays is not None:
        task.weekdays = weekdays_to_storage(payload.weekdays)

    db.commit()
    db.refresh(task)
    return serialize_weekly_task(task)


@router.delete("/weekly/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_weekly_task(task_id: int, db: Session = Depends(get_db)) -> Response:
    task = get_active_weekly_task_or_404(db, task_id)
    task.is_archived = True
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/weekly/{task_id}/complete", response_model=WeeklyTaskCompletionRead)
def complete_weekly_task(
    task_id: int,
    completion_date: date = Query(...),
    db: Session = Depends(get_db),
) -> WeeklyTaskCompletion:
    task = get_active_weekly_task_or_404(db, task_id)
    validate_weekly_completion_date(task, completion_date)
    completion = db.scalar(
        select(WeeklyTaskCompletion).where(
            WeeklyTaskCompletion.weekly_task_id == task_id,
            WeeklyTaskCompletion.completion_date == completion_date,
        )
    )
    if completion is None:
        completion = WeeklyTaskCompletion(
            weekly_task_id=task_id,
            completion_date=completion_date,
        )
        db.add(completion)
        db.commit()
        db.refresh(completion)
    return completion


@router.post("/weekly/{task_id}/incomplete", status_code=status.HTTP_204_NO_CONTENT)
def incomplete_weekly_task(
    task_id: int,
    completion_date: date = Query(...),
    db: Session = Depends(get_db),
) -> Response:
    task = get_active_weekly_task_or_404(db, task_id)
    validate_weekly_completion_date(task, completion_date)
    completion = db.scalar(
        select(WeeklyTaskCompletion).where(
            WeeklyTaskCompletion.weekly_task_id == task_id,
            WeeklyTaskCompletion.completion_date == completion_date,
        )
    )
    if completion is not None:
        db.delete(completion)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
