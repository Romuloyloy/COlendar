from datetime import date as date_type, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.calendar.models import CalendarEvent
from app.modules.calendar.schemas import (
    CalendarEventCreate,
    CalendarEventRead,
    CalendarEventUpdate,
    CalendarOverviewRead,
)
from app.modules.calendar.service import (
    apply_calendar_event_payload,
    get_calendar_overview,
    get_active_calendar_event_or_404,
    list_calendar_event_occurrences_between,
    list_calendar_events_for_date,
    list_upcoming_calendar_event_occurrences,
    validate_calendar_event_update,
)
from app.modules.calendar.recurrence import (
    normalized_event_weekday_storage,
    recurrence_interval_for,
    serialize_calendar_event_occurrence,
)
from app.modules.tasks.service import validate_optional_category

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/overview", response_model=CalendarOverviewRead)
def get_calendar_overview_endpoint(
    from_date: date_type = Query(...),
    to_date: date_type = Query(...),
    db: Session = Depends(get_db),
) -> CalendarOverviewRead:
    if to_date < from_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="to_date cannot be before from_date",
        )
    return get_calendar_overview(db, from_date, to_date)


@router.get("/events", response_model=list[CalendarEventRead])
def list_calendar_events(
    date: date_type | None = Query(default=None),
    from_date: date_type | None = Query(default=None),
    to_date: date_type | None = Query(default=None),
    upcoming: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> list[CalendarEventRead]:
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
        return list_upcoming_calendar_event_occurrences(
            db,
            from_date or date_type.today(),
            limit=10,
        )
    if date is not None:
        return list_calendar_events_for_date(db, date)
    if from_date is not None or to_date is not None:
        range_start = from_date or (to_date - timedelta(days=365))
        range_end = to_date or (from_date + timedelta(days=365))
        return list_calendar_event_occurrences_between(db, range_start, range_end)

    events = db.scalars(
        select(CalendarEvent)
        .where(CalendarEvent.is_archived.is_(False))
        .order_by(
            CalendarEvent.event_date.asc(),
            CalendarEvent.start_time.asc().nulls_last(),
            CalendarEvent.id.asc(),
        )
    )
    return [serialize_calendar_event_occurrence(event) for event in events]


@router.post("/events", response_model=CalendarEventRead, status_code=status.HTTP_201_CREATED)
def create_calendar_event(
    payload: CalendarEventCreate,
    db: Session = Depends(get_db),
) -> CalendarEventRead:
    validate_optional_category(db, payload.category_id)
    event = CalendarEvent(
        title=payload.title.strip(),
        description=payload.description,
        event_date=payload.event_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location=payload.location.strip(),
        category_id=payload.category_id,
        recurrence_type=payload.recurrence_type,
        weekdays=normalized_event_weekday_storage(
            payload.recurrence_type,
            payload.weekdays,
        ),
        interval_weeks=recurrence_interval_for(payload.recurrence_type),
        anchor_date=payload.anchor_date if payload.recurrence_type == "biweekly" else None,
        day_of_month=payload.day_of_month
        if payload.recurrence_type == "monthly_day"
        else None,
        recurrence_end_date=payload.recurrence_end_date
        if payload.recurrence_type != "none"
        else None,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return serialize_calendar_event_occurrence(event)


@router.get("/events/{event_id}", response_model=CalendarEventRead)
def get_calendar_event(event_id: int, db: Session = Depends(get_db)) -> CalendarEventRead:
    return serialize_calendar_event_occurrence(
        get_active_calendar_event_or_404(db, event_id)
    )


@router.patch("/events/{event_id}", response_model=CalendarEventRead)
def update_calendar_event(
    event_id: int,
    payload: CalendarEventUpdate,
    db: Session = Depends(get_db),
) -> CalendarEventRead:
    event = get_active_calendar_event_or_404(db, event_id)
    validate_calendar_event_update(event, payload)
    apply_calendar_event_payload(event, payload, db)

    db.commit()
    db.refresh(event)
    return serialize_calendar_event_occurrence(event)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_calendar_event(event_id: int, db: Session = Depends(get_db)) -> Response:
    event = get_active_calendar_event_or_404(db, event_id)
    event.is_archived = True
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
