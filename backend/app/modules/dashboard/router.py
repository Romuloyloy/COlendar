from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.dashboard.schemas import DashboardSummary
from app.modules.dashboard.service import get_dashboard_summary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    date: date = Query(...),
    recent_notes_limit: int = Query(default=5, ge=1, le=10),
    upcoming_events_limit: int = Query(default=5, ge=1, le=10),
    db: Session = Depends(get_db),
) -> DashboardSummary:
    return get_dashboard_summary(
        db=db,
        selected_date=date,
        recent_notes_limit=recent_notes_limit,
        upcoming_events_limit=upcoming_events_limit,
    )
