from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.calendar.models import CalendarEvent
from app.modules.calendar.schemas import (
    CalendarEventCreate,
    CalendarEventRead,
    CalendarEventUpdate,
)
from app.modules.calendar.service import (
    get_active_calendar_event_or_404,
    upcoming_events_query,
    validate_calendar_event_update,
)

router = APIRouter(prefix="/api/calendar/events", tags=["calendar"])


@router.get("", response_model=list[CalendarEventRead])
def list_calendar_events(
    date: date_type | None = Query(default=None),
    from_date: date_type | None = Query(default=None),
    to_date: date_type | None = Query(default=None),
    upcoming: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> list[CalendarEvent]:
    if date is not None and (from_date is not None or to_date is not None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use either date or from_date/to_date, not both",
        )
    if from_date is not None and to_date is not None and to_date < from_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="to_date cannot be before from_date",
        )

    if upcoming:
        query = upcoming_events_query(from_date or date_type.today()).limit(10)
    else:
        query = (
            select(CalendarEvent)
            .where(CalendarEvent.is_archived.is_(False))
            .order_by(
                CalendarEvent.event_date.asc(),
                CalendarEvent.start_time.asc().nulls_last(),
                CalendarEvent.id.asc(),
            )
        )
        if date is not None:
            query = query.where(CalendarEvent.event_date == date)
        if from_date is not None:
            query = query.where(CalendarEvent.event_date >= from_date)
        if to_date is not None:
            query = query.where(CalendarEvent.event_date <= to_date)

    return list(db.scalars(query))


@router.post("", response_model=CalendarEventRead, status_code=status.HTTP_201_CREATED)
def create_calendar_event(
    payload: CalendarEventCreate,
    db: Session = Depends(get_db),
) -> CalendarEvent:
    event = CalendarEvent(
        title=payload.title.strip(),
        description=payload.description,
        event_date=payload.event_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location=payload.location.strip(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/{event_id}", response_model=CalendarEventRead)
def get_calendar_event(event_id: int, db: Session = Depends(get_db)) -> CalendarEvent:
    return get_active_calendar_event_or_404(db, event_id)


@router.patch("/{event_id}", response_model=CalendarEventRead)
def update_calendar_event(
    event_id: int,
    payload: CalendarEventUpdate,
    db: Session = Depends(get_db),
) -> CalendarEvent:
    event = get_active_calendar_event_or_404(db, event_id)
    validate_calendar_event_update(event, payload)

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

    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_calendar_event(event_id: int, db: Session = Depends(get_db)) -> Response:
    event = get_active_calendar_event_or_404(db, event_id)
    event.is_archived = True
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
