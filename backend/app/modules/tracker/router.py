from datetime import date

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.tracker.models import ActivityEntry, WaterEntry
from app.modules.tracker.schemas import (
    ActivityEntryCreate,
    ActivityEntryRead,
    TrackerSummary,
    WaterEntryCreate,
    WaterEntryRead,
)
from app.modules.tracker.service import (
    get_active_activity_entry_or_404,
    get_active_water_entry_or_404,
    get_tracker_summary,
    list_active_activity_entries,
    list_active_water_entries,
)

router = APIRouter(prefix="/api/tracker", tags=["tracker"])


@router.get("/water", response_model=list[WaterEntryRead])
def list_water_entries(
    date: date = Query(...),
    db: Session = Depends(get_db),
) -> list[WaterEntry]:
    return list_active_water_entries(db, date)


@router.post(
    "/water",
    response_model=WaterEntryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_water_entry(
    payload: WaterEntryCreate,
    db: Session = Depends(get_db),
) -> WaterEntry:
    entry = WaterEntry(
        entry_date=payload.entry_date,
        amount_ml=payload.amount_ml,
        note=payload.note,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/water/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_water_entry(entry_id: int, db: Session = Depends(get_db)) -> Response:
    entry = get_active_water_entry_or_404(db, entry_id)
    entry.is_archived = True
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/activity", response_model=list[ActivityEntryRead])
def list_activity_entries(
    date: date = Query(...),
    db: Session = Depends(get_db),
) -> list[ActivityEntry]:
    return list_active_activity_entries(db, date)


@router.post(
    "/activity",
    response_model=ActivityEntryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_activity_entry(
    payload: ActivityEntryCreate,
    db: Session = Depends(get_db),
) -> ActivityEntry:
    entry = ActivityEntry(
        entry_date=payload.entry_date,
        activity_type=payload.activity_type.strip(),
        duration_minutes=payload.duration_minutes,
        quantity=payload.quantity,
        note=payload.note,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/activity/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_activity_entry(entry_id: int, db: Session = Depends(get_db)) -> Response:
    entry = get_active_activity_entry_or_404(db, entry_id)
    entry.is_archived = True
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/summary", response_model=TrackerSummary)
def tracker_summary(
    date: date = Query(...),
    db: Session = Depends(get_db),
) -> TrackerSummary:
    return get_tracker_summary(db, date)
