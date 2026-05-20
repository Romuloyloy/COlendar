from datetime import date

from app.modules.calendar.models import CalendarEvent
from app.modules.calendar.schemas import CalendarEventRead
from app.modules.tasks.schemas import weekdays_from_storage, weekdays_to_storage


def recurrence_interval_for(recurrence_type: str) -> int:
    return 2 if recurrence_type == "biweekly" else 1


def normalized_event_weekday_storage(
    recurrence_type: str,
    weekdays: list[int],
) -> str:
    if recurrence_type in {"none", "monthly_day"}:
        return ""
    return weekdays_to_storage(weekdays)


def is_event_scheduled_on_date(event: CalendarEvent, selected_date: date) -> bool:
    if event.is_archived:
        return False
    if event.recurrence_type == "none":
        return event.event_date == selected_date
    if selected_date < event.event_date:
        return False
    if event.recurrence_end_date is not None and selected_date > event.recurrence_end_date:
        return False

    if event.recurrence_type == "monthly_day":
        return event.day_of_month == selected_date.day

    weekdays = weekdays_from_storage(event.weekdays)
    if selected_date.weekday() not in weekdays:
        return False

    if event.recurrence_type == "biweekly":
        if event.anchor_date is None or selected_date < event.anchor_date:
            return False
        anchor_week_start = event.anchor_date.toordinal() - event.anchor_date.weekday()
        selected_week_start = selected_date.toordinal() - selected_date.weekday()
        weeks_since_anchor = (selected_week_start - anchor_week_start) // 7
        return weeks_since_anchor >= 0 and weeks_since_anchor % 2 == 0

    return True


def serialize_calendar_event_occurrence(
    event: CalendarEvent,
    occurrence_date: date | None = None,
) -> CalendarEventRead:
    return CalendarEventRead(
        id=event.id,
        title=event.title,
        description=event.description,
        event_date=occurrence_date if occurrence_date is not None else event.event_date,
        start_time=event.start_time,
        end_time=event.end_time,
        location=event.location,
        category_id=event.category_id,
        recurrence_type=event.recurrence_type,
        weekdays=weekdays_from_storage(event.weekdays),
        interval_weeks=event.interval_weeks,
        anchor_date=event.anchor_date,
        day_of_month=event.day_of_month,
        recurrence_end_date=event.recurrence_end_date,
        is_archived=event.is_archived,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )
