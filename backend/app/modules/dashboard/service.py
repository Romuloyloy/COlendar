from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.dashboard.models import DashboardWidgetPreference
from app.modules.dashboard.schemas import (
    DashboardCounts,
    DashboardSummary,
    DashboardWidgetLayoutRead,
    DashboardWidgetLayoutUpdate,
    DashboardWidgetPreferenceRead,
    DashboardWidgetPreferenceUpdate,
    DashboardWeeklyTaskRead,
)
from app.modules.dashboard.widget_catalog import (
    DEFAULT_DASHBOARD_WIDGET_KEYS,
    VALID_DASHBOARD_WIDGET_KEYS,
)
from app.modules.calendar.service import upcoming_events_query
from app.modules.notes.models import Note
from app.modules.tasks.models import DailyTask, WeeklyTaskCompletion
from app.modules.tasks.schemas import weekdays_from_storage
from app.modules.tasks.service import list_recurring_tasks_scheduled_for_date
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
            .order_by(
                DailyTask.is_completed.asc(),
                DailyTask.planned_time.asc().nulls_last(),
                DailyTask.id.asc(),
            )
        )
    )

    scheduled_weekly_tasks = list_recurring_tasks_scheduled_for_date(db, selected_date)

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


def get_dashboard_widget_layout(db: Session) -> DashboardWidgetLayoutRead:
    preferences = _ensure_dashboard_widget_preferences(db)
    return DashboardWidgetLayoutRead(widgets=_serialize_preferences(preferences))


def update_dashboard_widget_layout(
    db: Session,
    payload: DashboardWidgetLayoutUpdate,
) -> DashboardWidgetLayoutRead:
    _validate_widget_keys([widget.widget_key for widget in payload.widgets])

    existing_preferences = {
        preference.widget_key: preference
        for preference in db.scalars(select(DashboardWidgetPreference))
    }
    ordered_updates = _append_missing_widget_updates(payload.widgets)

    for sort_order, widget_update in enumerate(ordered_updates):
        preference = existing_preferences.get(widget_update.widget_key)
        if preference is None:
            preference = DashboardWidgetPreference(widget_key=widget_update.widget_key)
            db.add(preference)

        preference.sort_order = sort_order
        preference.is_visible = widget_update.is_visible
        preference.config_json = widget_update.config_json

    db.commit()
    preferences = _known_preferences_query(db)
    return DashboardWidgetLayoutRead(widgets=_serialize_preferences(preferences))


def reset_dashboard_widget_layout(db: Session) -> DashboardWidgetLayoutRead:
    existing_preferences = {
        preference.widget_key: preference
        for preference in db.scalars(select(DashboardWidgetPreference))
    }

    for sort_order, widget_key in enumerate(DEFAULT_DASHBOARD_WIDGET_KEYS):
        preference = existing_preferences.get(widget_key)
        if preference is None:
            preference = DashboardWidgetPreference(widget_key=widget_key)
            db.add(preference)

        preference.sort_order = sort_order
        preference.is_visible = True
        preference.config_json = {}

    db.commit()
    preferences = _known_preferences_query(db)
    return DashboardWidgetLayoutRead(widgets=_serialize_preferences(preferences))


def _ensure_dashboard_widget_preferences(
    db: Session,
) -> list[DashboardWidgetPreference]:
    preferences = list(
        db.scalars(
            select(DashboardWidgetPreference).order_by(
                DashboardWidgetPreference.sort_order.asc(),
                DashboardWidgetPreference.id.asc(),
            )
        )
    )
    preferences_by_key = {preference.widget_key: preference for preference in preferences}
    did_change = False

    next_sort_order = len(preferences)
    for widget_key in DEFAULT_DASHBOARD_WIDGET_KEYS:
        if widget_key not in preferences_by_key:
            preference = DashboardWidgetPreference(
                widget_key=widget_key,
                sort_order=next_sort_order,
                is_visible=True,
                config_json={},
            )
            preferences_by_key[widget_key] = preference
            db.add(preference)
            next_sort_order += 1
            did_change = True

    if did_change:
        db.commit()

    return _known_preferences_query(db)


def _known_preferences_query(db: Session) -> list[DashboardWidgetPreference]:
    return list(
        db.scalars(
            select(DashboardWidgetPreference)
            .where(
                DashboardWidgetPreference.widget_key.in_(
                    list(VALID_DASHBOARD_WIDGET_KEYS)
                )
            )
            .order_by(
                DashboardWidgetPreference.sort_order.asc(),
                DashboardWidgetPreference.id.asc(),
            )
        )
    )


def _serialize_preferences(
    preferences: list[DashboardWidgetPreference],
) -> list[DashboardWidgetPreferenceRead]:
    return [
        DashboardWidgetPreferenceRead.model_validate(preference)
        for preference in preferences
        if preference.widget_key in VALID_DASHBOARD_WIDGET_KEYS
    ]


def _validate_widget_keys(widget_keys: list[str]) -> None:
    unknown_widget_keys = [
        widget_key
        for widget_key in widget_keys
        if widget_key not in VALID_DASHBOARD_WIDGET_KEYS
    ]
    if unknown_widget_keys:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown dashboard widget key: {unknown_widget_keys[0]}",
        )


def _append_missing_widget_updates(
    updates: list[DashboardWidgetPreferenceUpdate],
) -> list[DashboardWidgetPreferenceUpdate]:
    updates_by_key = {widget.widget_key: widget for widget in updates}
    ordered_updates = list(updates)

    for widget_key in DEFAULT_DASHBOARD_WIDGET_KEYS:
        if widget_key not in updates_by_key:
            ordered_updates.append(
                DashboardWidgetPreferenceUpdate(
                    widget_key=widget_key,
                    is_visible=True,
                    config_json={},
                )
            )

    return ordered_updates
