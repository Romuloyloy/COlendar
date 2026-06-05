from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.export import service

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/full")
def export_full(db: Session = Depends(get_db)) -> dict[str, Any]:
    return service.full_export(db)


@router.get("/categories")
def export_categories(db: Session = Depends(get_db)) -> dict[str, Any]:
    return service.categories_export(db)


@router.get("/notes")
def export_notes(db: Session = Depends(get_db)) -> dict[str, Any]:
    return service.notes_export(db)


@router.get("/tasks")
def export_tasks(db: Session = Depends(get_db)) -> dict[str, Any]:
    return service.tasks_export(db)


@router.get("/calendar")
def export_calendar(db: Session = Depends(get_db)) -> dict[str, Any]:
    return service.calendar_export(db)


@router.get("/tracker")
def export_tracker(db: Session = Depends(get_db)) -> dict[str, Any]:
    return service.tracker_export(db)


@router.get("/sheets")
def export_sheets(db: Session = Depends(get_db)) -> dict[str, Any]:
    return service.sheets_export(db)
