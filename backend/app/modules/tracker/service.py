from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.tracker.models import ActivityEntry, WaterEntry
from app.modules.tracker.schemas import TrackerSummary


def get_active_water_entry_or_404(db: Session, entry_id: int) -> WaterEntry:
    entry = db.scalar(
        select(WaterEntry).where(
            WaterEntry.id == entry_id,
            WaterEntry.is_archived.is_(False),
        )
    )
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Water entry not found",
        )
    return entry


def get_active_activity_entry_or_404(db: Session, entry_id: int) -> ActivityEntry:
    entry = db.scalar(
        select(ActivityEntry).where(
            ActivityEntry.id == entry_id,
            ActivityEntry.is_archived.is_(False),
        )
    )
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity entry not found",
        )
    return entry


def list_active_water_entries(db: Session, selected_date: date) -> list[WaterEntry]:
    return list(
        db.scalars(
            select(WaterEntry)
            .where(
                WaterEntry.entry_date == selected_date,
                WaterEntry.is_archived.is_(False),
            )
            .order_by(WaterEntry.id.asc())
        )
    )


def list_active_activity_entries(
    db: Session,
    selected_date: date,
) -> list[ActivityEntry]:
    return list(
        db.scalars(
            select(ActivityEntry)
            .where(
                ActivityEntry.entry_date == selected_date,
                ActivityEntry.is_archived.is_(False),
            )
            .order_by(ActivityEntry.id.asc())
        )
    )


def get_tracker_summary(db: Session, selected_date: date) -> TrackerSummary:
    water_entries = list_active_water_entries(db, selected_date)
    activity_entries = list_active_activity_entries(db, selected_date)

    return TrackerSummary(
        selected_date=selected_date,
        water_entries=water_entries,
        activity_entries=activity_entries,
        total_water_ml=sum(entry.amount_ml for entry in water_entries),
        activity_count=len(activity_entries),
        total_activity_minutes=sum(
            entry.duration_minutes or 0 for entry in activity_entries
        ),
    )
