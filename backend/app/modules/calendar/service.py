from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.calendar.models import CalendarEvent
from app.modules.calendar.recurrence import (
    is_event_scheduled_on_date,
    normalized_event_weekday_storage,
    recurrence_interval_for,
    serialize_calendar_event_occurrence,
)
from app.modules.calendar.schemas import (
    CalendarOverviewDay,
    CalendarOverviewRead,
    CalendarRecurringTaskOccurrence,
    CalendarEventUpdate,
    validate_event_recurrence_fields,
)
from app.modules.planning.service import (
    list_daily_tasks_for_date,
    list_weekly_task_occurrences_for_date,
)
from app.modules.tasks.service import validate_optional_category


def get_active_calendar_event_or_404(db: Session, event_id: int) -> CalendarEvent:
    event = db.scalar(
        select(CalendarEvent).where(
            CalendarEvent.id == event_id,
            CalendarEvent.is_archived.is_(False),
        )
    )
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar event not found",
        )
    return event


def validate_event_time_range(
    start_time,
    end_time,
) -> None:
    if start_time is not None and end_time is not None and end_time < start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event end time cannot be before start time",
        )


def validate_calendar_event_update(event: CalendarEvent, payload: CalendarEventUpdate) -> None:
    start_time = (
        payload.start_time
        if "start_time" in payload.model_fields_set
        else event.start_time
    )
    end_time = (
        payload.end_time
        if "end_time" in payload.model_fields_set
        else event.end_time
    )
    validate_event_time_range(start_time, end_time)

    recurrence_type = (
        payload.recurrence_type
        if "recurrence_type" in payload.model_fields_set and payload.recurrence_type is not None
        else event.recurrence_type
    )
    weekdays = (
        payload.weekdays
        if "weekdays" in payload.model_fields_set and payload.weekdays is not None
        else serialize_calendar_event_occurrence(event).weekdays
    )
    event_date = (
        payload.event_date
        if "event_date" in payload.model_fields_set and payload.event_date is not None
        else event.event_date
    )
    anchor_date = (
        payload.anchor_date
        if "anchor_date" in payload.model_fields_set
        else event.anchor_date
    )
    day_of_month = (
        payload.day_of_month
        if "day_of_month" in payload.model_fields_set
        else event.day_of_month
    )
    recurrence_end_date = (
        payload.recurrence_end_date
        if "recurrence_end_date" in payload.model_fields_set
        else event.recurrence_end_date
    )
    try:
        validate_event_recurrence_fields(
            recurrence_type=recurrence_type,
            weekdays=weekdays,
            event_date=event_date,
            anchor_date=anchor_date,
            day_of_month=day_of_month,
            recurrence_end_date=recurrence_end_date,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


def apply_calendar_event_payload(
    event: CalendarEvent,
    payload,
    db: Session,
) -> None:
    if "category_id" in payload.model_fields_set:
        validate_optional_category(db, payload.category_id)
        event.category_id = payload.category_id
    if "title" in payload.model_fields_set and payload.title is not None:
        event.title = payload.title.strip()
    if "description" in payload.model_fields_set and payload.description is not None:
        event.description = payload.description
    if "event_date" in payload.model_fields_set and payload.event_date is not None:
        event.event_date = payload.event_date
    if "start_time" in payload.model_fields_set:
        event.start_time = payload.start_time
    if "end_time" in payload.model_fields_set:
        event.end_time = payload.end_time
    if "location" in payload.model_fields_set and payload.location is not None:
        event.location = payload.location.strip()
    if "recurrence_type" in payload.model_fields_set and payload.recurrence_type is not None:
        event.recurrence_type = payload.recurrence_type
    if "weekdays" in payload.model_fields_set and payload.weekdays is not None:
        event.weekdays = normalized_event_weekday_storage(
            event.recurrence_type,
            payload.weekdays,
        )
    if "anchor_date" in payload.model_fields_set:
        event.anchor_date = (
            payload.anchor_date if event.recurrence_type == "biweekly" else None
        )
    if "day_of_month" in payload.model_fields_set:
        event.day_of_month = (
            payload.day_of_month if event.recurrence_type == "monthly_day" else None
        )
    if "recurrence_end_date" in payload.model_fields_set:
        event.recurrence_end_date = payload.recurrence_end_date

    event.interval_weeks = recurrence_interval_for(event.recurrence_type)
    if event.recurrence_type in {"none", "monthly_day"}:
        event.weekdays = ""
    if event.recurrence_type != "biweekly":
        event.anchor_date = None
    if event.recurrence_type != "monthly_day":
        event.day_of_month = None
    if event.recurrence_type == "none":
        event.recurrence_end_date = None


def list_calendar_events_for_date(
    db: Session,
    selected_date: date,
    category_id: int | None = None,
):
    validate_optional_category(db, category_id)
    query = select(CalendarEvent).where(
        CalendarEvent.is_archived.is_(False),
        CalendarEvent.event_date <= selected_date,
    )
    if category_id is not None:
        query = query.where(CalendarEvent.category_id == category_id)
    events = list(
        db.scalars(
            query
            .order_by(
                CalendarEvent.start_time.asc().nulls_last(),
                CalendarEvent.id.asc(),
            )
        )
    )
    return [
        serialize_calendar_event_occurrence(event, selected_date)
        for event in events
        if is_event_scheduled_on_date(event, selected_date)
    ]


def list_calendar_event_occurrences_between(
    db: Session,
    from_date: date,
    to_date: date,
    category_id: int | None = None,
):
    day_count = (to_date - from_date).days + 1
    occurrences = []
    for offset in range(day_count):
        occurrences.extend(
            list_calendar_events_for_date(
                db,
                from_date + timedelta(days=offset),
                category_id,
            )
        )
    return sorted(
        occurrences,
        key=lambda event: (
            event.event_date,
            event.start_time is None,
            event.start_time,
            event.id,
        ),
    )


def list_upcoming_calendar_event_occurrences(
    db: Session,
    from_date: date,
    limit: int = 10,
    category_id: int | None = None,
):
    to_date = from_date + timedelta(days=365)
    return list_calendar_event_occurrences_between(
        db,
        from_date,
        to_date,
        category_id,
    )[:limit]


def get_calendar_overview(
    db: Session,
    from_date: date,
    to_date: date,
) -> CalendarOverviewRead:
    day_count = (to_date - from_date).days + 1
    days = [
        CalendarOverviewDay(
            date=selected_date,
            calendar_events=list_calendar_events_for_date(db, selected_date),
            daily_tasks=list_daily_tasks_for_date(db, selected_date),
            recurring_tasks=[
                CalendarRecurringTaskOccurrence.model_validate(
                    occurrence.model_dump()
                )
                for occurrence in list_weekly_task_occurrences_for_date(
                    db, selected_date
                )
            ],
        )
        for selected_date in (
            from_date + timedelta(days=offset) for offset in range(day_count)
        )
    ]
    return CalendarOverviewRead(from_date=from_date, to_date=to_date, days=days)
