from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.calendar.models import CalendarEvent
from app.modules.calendar.schemas import (
    CalendarOverviewDay,
    CalendarOverviewRead,
    CalendarRecurringTaskOccurrence,
    CalendarEventUpdate,
)
from app.modules.planning.service import (
    list_calendar_events_for_date,
    list_daily_tasks_for_date,
    list_weekly_task_occurrences_for_date,
)


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


def upcoming_events_query(from_date: date):
    return (
        select(CalendarEvent)
        .where(
            CalendarEvent.event_date >= from_date,
            CalendarEvent.is_archived.is_(False),
        )
        .order_by(
            CalendarEvent.event_date.asc(),
            CalendarEvent.start_time.asc().nulls_last(),
            CalendarEvent.id.asc(),
        )
    )


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
