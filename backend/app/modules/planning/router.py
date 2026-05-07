from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.planning.schemas import DailyPlan, WeeklyPlan
from app.modules.planning.service import get_daily_plan, get_weekly_plan

router = APIRouter(prefix="/api/planning", tags=["planning"])


@router.get("/daily", response_model=DailyPlan)
def daily_plan(
    date: date = Query(...),
    db: Session = Depends(get_db),
) -> DailyPlan:
    return get_daily_plan(db, date)


@router.get("/weekly", response_model=WeeklyPlan)
def weekly_plan(
    date: date = Query(...),
    db: Session = Depends(get_db),
) -> WeeklyPlan:
    return get_weekly_plan(db, date)
