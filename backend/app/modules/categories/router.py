from datetime import date as date_type

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.categories.schemas import CategoryOverviewRead
from app.modules.categories.service import get_category_overview

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("/{category_id}/overview", response_model=CategoryOverviewRead)
def category_overview(
    category_id: int,
    date: date_type = Query(...),
    recent_notes_limit: int = Query(default=5, ge=1, le=10),
    upcoming_events_limit: int = Query(default=5, ge=1, le=10),
    db: Session = Depends(get_db),
) -> CategoryOverviewRead:
    return get_category_overview(
        db,
        category_id,
        date,
        recent_notes_limit=recent_notes_limit,
        upcoming_events_limit=upcoming_events_limit,
    )
