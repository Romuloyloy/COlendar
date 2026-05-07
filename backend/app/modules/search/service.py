from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.modules.calendar.models import CalendarEvent
from app.modules.notes.models import Folder, Note
from app.modules.search.schemas import SearchResponse, SearchResult, SearchResultGroups
from app.modules.tasks.models import DailyTask, WeeklyTask

RESULT_LIMIT = 20


def search_all(db: Session, query: str) -> SearchResponse:
    normalized_query = query.strip()
    pattern = f"%{normalized_query.lower()}%"

    return SearchResponse(
        query=normalized_query,
        results=SearchResultGroups(
            notes=search_notes(db, pattern),
            folders=search_folders(db, pattern),
            daily_tasks=search_daily_tasks(db, pattern),
            weekly_tasks=search_weekly_tasks(db, pattern),
            calendar_events=search_calendar_events(db, pattern),
        ),
    )


def matches_pattern(*columns, pattern: str):
    return or_(*(func.lower(column).like(pattern) for column in columns))


def preview_text(value: str, max_length: int = 160) -> str | None:
    text = " ".join(value.split())
    if not text:
        return None
    if len(text) <= max_length:
        return text
    return f"{text[: max_length - 3].rstrip()}..."


def search_notes(db: Session, pattern: str) -> list[SearchResult]:
    notes = db.scalars(
        select(Note)
        .where(
            Note.is_archived.is_(False),
            matches_pattern(Note.title, Note.content, pattern=pattern),
        )
        .order_by(Note.updated_at.desc(), Note.id.desc())
        .limit(RESULT_LIMIT)
    )
    return [
        SearchResult(
            id=note.id,
            type="note",
            title=note.title,
            subtitle="Note",
            preview=preview_text(note.content),
            target_url="/notes",
        )
        for note in notes
    ]


def search_folders(db: Session, pattern: str) -> list[SearchResult]:
    folders = db.scalars(
        select(Folder)
        .where(
            Folder.is_archived.is_(False),
            matches_pattern(Folder.name, pattern=pattern),
        )
        .order_by(Folder.name.asc(), Folder.id.asc())
        .limit(RESULT_LIMIT)
    )
    return [
        SearchResult(
            id=folder.id,
            type="folder",
            title=folder.name,
            subtitle="Folder",
            target_url="/notes",
        )
        for folder in folders
    ]


def search_daily_tasks(db: Session, pattern: str) -> list[SearchResult]:
    tasks = db.scalars(
        select(DailyTask)
        .where(
            DailyTask.is_archived.is_(False),
            matches_pattern(DailyTask.title, DailyTask.description, pattern=pattern),
        )
        .order_by(DailyTask.task_date.desc(), DailyTask.id.desc())
        .limit(RESULT_LIMIT)
    )
    return [
        SearchResult(
            id=task.id,
            type="daily_task",
            title=task.title,
            subtitle="Daily task",
            preview=preview_text(task.description),
            date=task.task_date,
            target_url="/tasks",
        )
        for task in tasks
    ]


def search_weekly_tasks(db: Session, pattern: str) -> list[SearchResult]:
    tasks = db.scalars(
        select(WeeklyTask)
        .where(
            WeeklyTask.is_archived.is_(False),
            matches_pattern(WeeklyTask.title, WeeklyTask.description, pattern=pattern),
        )
        .order_by(WeeklyTask.id.asc())
        .limit(RESULT_LIMIT)
    )
    return [
        SearchResult(
            id=task.id,
            type="weekly_task",
            title=task.title,
            subtitle="Weekly task",
            preview=preview_text(task.description),
            target_url="/tasks",
        )
        for task in tasks
    ]


def search_calendar_events(db: Session, pattern: str) -> list[SearchResult]:
    events = db.scalars(
        select(CalendarEvent)
        .where(
            CalendarEvent.is_archived.is_(False),
            matches_pattern(
                CalendarEvent.title,
                CalendarEvent.description,
                CalendarEvent.location,
                pattern=pattern,
            ),
        )
        .order_by(
            CalendarEvent.event_date.asc(),
            CalendarEvent.start_time.asc().nulls_last(),
            CalendarEvent.id.asc(),
        )
        .limit(RESULT_LIMIT)
    )
    return [
        SearchResult(
            id=event.id,
            type="calendar_event",
            title=event.title,
            subtitle="Calendar event",
            preview=preview_text(event.description or event.location),
            date=event.event_date,
            target_url="/calendar",
        )
        for event in events
    ]
