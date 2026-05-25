from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.review.schemas import ReviewSummary
from app.modules.review.service import get_review_summary

router = APIRouter(prefix="/api/review", tags=["review"])


@router.get("/summary", response_model=ReviewSummary)
def review_summary(
    date: date = Query(...),
    db: Session = Depends(get_db),
) -> ReviewSummary:
    return get_review_summary(db, date)
