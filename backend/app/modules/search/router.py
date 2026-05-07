from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.search.schemas import SearchResponse
from app.modules.search.service import search_all

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchResponse)
def global_search(
    q: str = Query(default=""),
    db: Session = Depends(get_db),
) -> SearchResponse:
    if not q.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Search query cannot be empty",
        )

    return search_all(db, q)
