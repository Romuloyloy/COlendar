from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.calendar.models import CalendarEvent
from app.modules.calendar.schemas import CalendarEventUpdate


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
