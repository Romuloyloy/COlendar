from datetime import date

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.tasks.models import DailyTask, TaskCategory, WeeklyTask, WeeklyTaskCompletion
from app.modules.tasks.schemas import (
    DailyTaskCreate,
    DailyTaskRead,
    DailyTaskUpdate,
    TaskCategoryCreate,
    TaskCategoryRead,
    TaskCategoryUpdate,
    WeeklyTaskCompletionRead,
    WeeklyTaskCreate,
    WeeklyTaskRead,
    WeeklyTaskUpdate,
    weekdays_from_storage,
    weekdays_to_storage,
)
from app.modules.tasks.service import (
    get_active_task_category_or_404,
    get_active_daily_task_or_404,
    get_active_weekly_task_or_404,
    validate_optional_category,
    validate_unique_active_category_name,
    validate_weekly_completion_date,
)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def serialize_weekly_task(task: WeeklyTask) -> WeeklyTaskRead:
    return WeeklyTaskRead(
        id=task.id,
        title=task.title,
        description=task.description,
        weekdays=weekdays_from_storage(task.weekdays),
        category_id=task.category_id,
        is_archived=task.is_archived,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.get("/categories", response_model=list[TaskCategoryRead])
def list_task_categories(db: Session = Depends(get_db)) -> list[TaskCategory]:
    return list(
        db.scalars(
            select(TaskCategory)
            .where(TaskCategory.is_archived.is_(False))
            .order_by(TaskCategory.name.asc(), TaskCategory.id.asc())
        )
    )


@router.post(
    "/categories",
    response_model=TaskCategoryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_task_category(
    payload: TaskCategoryCreate,
    db: Session = Depends(get_db),
) -> TaskCategory:
    validate_unique_active_category_name(db, payload.name)
    category = TaskCategory(name=payload.name.strip(), color=payload.color)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/categories/{category_id}", response_model=TaskCategoryRead)
def update_task_category(
    category_id: int,
    payload: TaskCategoryUpdate,
    db: Session = Depends(get_db),
) -> TaskCategory:
    category = get_active_task_category_or_404(db, category_id)
    if "name" in payload.model_fields_set and payload.name is not None:
        validate_unique_active_category_name(db, payload.name, category_id=category.id)
        category.name = payload.name.strip()
    if "color" in payload.model_fields_set and payload.color is not None:
        category.color = payload.color

    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_task_category(
    category_id: int,
    db: Session = Depends(get_db),
) -> Response:
    category = get_active_task_category_or_404(db, category_id)
    category.is_archived = True
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/daily", response_model=list[DailyTaskRead])
def list_daily_tasks(
    date: date = Query(...),
    category_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[DailyTask]:
    validate_optional_category(db, category_id)
    query = select(DailyTask).where(
        DailyTask.task_date == date,
        DailyTask.is_archived.is_(False),
    )
    if category_id is not None:
        query = query.where(DailyTask.category_id == category_id)
    return list(
        db.scalars(
            query.order_by(DailyTask.is_completed.asc(), DailyTask.id.asc())
        )
    )


@router.post("/daily", response_model=DailyTaskRead, status_code=status.HTTP_201_CREATED)
def create_daily_task(payload: DailyTaskCreate, db: Session = Depends(get_db)) -> DailyTask:
    validate_optional_category(db, payload.category_id)
    task = DailyTask(
        title=payload.title.strip(),
        description=payload.description,
        task_date=payload.task_date,
        category_id=payload.category_id,
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
    if "category_id" in payload.model_fields_set:
        validate_optional_category(db, payload.category_id)
        task.category_id = payload.category_id

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
    category_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[WeeklyTaskRead]:
    validate_optional_category(db, category_id)
    query = select(WeeklyTask).where(WeeklyTask.is_archived.is_(False))
    if category_id is not None:
        query = query.where(WeeklyTask.category_id == category_id)
    tasks = list(
        db.scalars(
            query.order_by(WeeklyTask.id.asc())
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
    validate_optional_category(db, payload.category_id)
    task = WeeklyTask(
        title=payload.title.strip(),
        description=payload.description,
        weekdays=weekdays_to_storage(payload.weekdays),
        category_id=payload.category_id,
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
    if "category_id" in payload.model_fields_set:
        validate_optional_category(db, payload.category_id)
        task.category_id = payload.category_id

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
