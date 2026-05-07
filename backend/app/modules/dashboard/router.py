from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.dashboard.schemas import (
    DashboardSummary,
    DashboardWidgetLayoutRead,
    DashboardWidgetLayoutUpdate,
)
from app.modules.dashboard.service import (
    get_dashboard_summary,
    get_dashboard_widget_layout,
    reset_dashboard_widget_layout,
    update_dashboard_widget_layout,
)

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


@router.get("/widgets", response_model=DashboardWidgetLayoutRead)
def dashboard_widgets(db: Session = Depends(get_db)) -> DashboardWidgetLayoutRead:
    return get_dashboard_widget_layout(db)


@router.put("/widgets", response_model=DashboardWidgetLayoutRead)
def update_dashboard_widgets(
    payload: DashboardWidgetLayoutUpdate,
    db: Session = Depends(get_db),
) -> DashboardWidgetLayoutRead:
    return update_dashboard_widget_layout(db, payload)


@router.post("/widgets/reset", response_model=DashboardWidgetLayoutRead)
def reset_dashboard_widgets(db: Session = Depends(get_db)) -> DashboardWidgetLayoutRead:
    return reset_dashboard_widget_layout(db)
