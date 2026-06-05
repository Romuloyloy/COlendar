from datetime import date, datetime, time, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.calendar.models import CalendarEvent
from app.modules.dashboard.models import DashboardWidgetPreference
from app.modules.notes.models import Folder, Note
from app.modules.sheets.models import Sheet, SheetWidgetSlot
from app.modules.tasks.models import DailyTask, TaskCategory, WeeklyTask, WeeklyTaskCompletion
from app.modules.tracker.models import ActivityEntry, CalorieEntry, WaterEntry

APP_VERSION = "v0.1-alpha"


def full_export(db: Session) -> dict[str, Any]:
    notes = notes_export(db)
    return {
        "metadata": export_metadata(),
        "data": {
            "categories": categories_export(db)["categories"],
            "folders": notes["folders"],
            "notes": notes["notes"],
            "tasks": tasks_export(db),
            "calendar": calendar_export(db),
            "tracker": tracker_export(db),
            "sheets": sheets_export(db),
            "dashboard": dashboard_export(db),
        },
    }


def categories_export(db: Session) -> dict[str, Any]:
    return {
        "metadata": export_metadata(module="categories"),
        "categories": rows_for(db, TaskCategory),
    }


def notes_export(db: Session) -> dict[str, Any]:
    return {
        "metadata": export_metadata(module="notes"),
        "folders": rows_for(db, Folder),
        "notes": rows_for(db, Note),
    }


def tasks_export(db: Session) -> dict[str, Any]:
    return {
        "metadata": export_metadata(module="tasks"),
        "one_time_tasks": rows_for(db, DailyTask),
        "recurring_tasks": rows_for(db, WeeklyTask),
        "recurring_task_completions": rows_for(db, WeeklyTaskCompletion),
        "archived_records_included": True,
    }


def calendar_export(db: Session) -> dict[str, Any]:
    return {
        "metadata": export_metadata(module="calendar"),
        "events": rows_for(db, CalendarEvent),
        "archived_records_included": True,
    }


def tracker_export(db: Session) -> dict[str, Any]:
    return {
        "metadata": export_metadata(module="tracker"),
        "water_entries": rows_for(db, WaterEntry),
        "activity_entries": rows_for(db, ActivityEntry),
        "calorie_entries": rows_for(db, CalorieEntry),
        "archived_records_included": True,
    }


def sheets_export(db: Session) -> dict[str, Any]:
    return {
        "metadata": export_metadata(module="sheets"),
        "sheets": rows_for(db, Sheet),
        "sheet_widget_slots": rows_for(db, SheetWidgetSlot),
    }


def dashboard_export(db: Session) -> dict[str, Any]:
    return {
        "metadata": export_metadata(module="dashboard"),
        "widget_preferences": rows_for(db, DashboardWidgetPreference),
    }


def export_metadata(module: str | None = None) -> dict[str, str]:
    metadata = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "app": "COlendar",
        "version": APP_VERSION,
        "format": "backup-json-v1",
        "archived_records": "included",
    }
    if module is not None:
        metadata["module"] = module
    return metadata


def rows_for(db: Session, model: type[Any]) -> list[dict[str, Any]]:
    rows = db.scalars(select(model).order_by(model.id.asc())).all()
    return [serialize_model(row) for row in rows]


def serialize_model(row: Any) -> dict[str, Any]:
    return {
        column.name: serialize_value(getattr(row, column.name))
        for column in row.__table__.columns
    }


def serialize_value(value: Any) -> Any:
    if isinstance(value, datetime | date | time):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value
