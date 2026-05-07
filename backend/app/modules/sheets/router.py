from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.sheets.schemas import (
    SheetCreate,
    SheetDetailRead,
    SheetRead,
    SheetSlotsUpdate,
    SheetUpdate,
)
from app.modules.sheets.service import (
    create_sheet,
    delete_sheet,
    get_sheet,
    list_sheets,
    reset_default_sheets,
    update_sheet,
    update_sheet_slots,
)

router = APIRouter(prefix="/api/sheets", tags=["sheets"])


@router.get("", response_model=list[SheetRead])
def get_sheets(db: Session = Depends(get_db)) -> list[SheetRead]:
    return list_sheets(db)


@router.post("", response_model=SheetDetailRead, status_code=status.HTTP_201_CREATED)
def post_sheet(payload: SheetCreate, db: Session = Depends(get_db)) -> SheetDetailRead:
    return create_sheet(db, payload)


@router.get("/{sheet_id}", response_model=SheetDetailRead)
def get_sheet_detail(sheet_id: int, db: Session = Depends(get_db)) -> SheetDetailRead:
    return get_sheet(db, sheet_id)


@router.patch("/{sheet_id}", response_model=SheetDetailRead)
def patch_sheet(
    sheet_id: int,
    payload: SheetUpdate,
    db: Session = Depends(get_db),
) -> SheetDetailRead:
    return update_sheet(db, sheet_id, payload)


@router.delete("/{sheet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sheet_route(sheet_id: int, db: Session = Depends(get_db)) -> Response:
    delete_sheet(db, sheet_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{sheet_id}/slots", response_model=SheetDetailRead)
def put_sheet_slots(
    sheet_id: int,
    payload: SheetSlotsUpdate,
    db: Session = Depends(get_db),
) -> SheetDetailRead:
    return update_sheet_slots(db, sheet_id, payload)


@router.post("/reset-default", response_model=list[SheetRead])
def reset_sheets(db: Session = Depends(get_db)) -> list[SheetRead]:
    return reset_default_sheets(db)
