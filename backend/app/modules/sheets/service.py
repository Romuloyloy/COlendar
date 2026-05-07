from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, selectinload

from app.modules.dashboard.widget_catalog import (
    DEFAULT_DASHBOARD_WIDGET_KEYS,
    VALID_DASHBOARD_WIDGET_KEYS,
)
from app.modules.sheets.models import Sheet, SheetWidgetSlot
from app.modules.sheets.schemas import (
    SheetCreate,
    SheetDetailRead,
    SheetSlotsUpdate,
    SheetUpdate,
)
from app.modules.tasks.models import TaskCategory

DEFAULT_SHEET_NAME = "Default Sheet"
GRID_SLOT_COUNT = 8
VALID_SLOT_INDEXES = set(range(GRID_SLOT_COUNT))


def list_sheets(db: Session) -> list[Sheet]:
    _ensure_default_sheet(db)
    return _ordered_sheets(db)


def create_sheet(db: Session, payload: SheetCreate) -> SheetDetailRead:
    next_sort_order = db.scalar(select(func.count(Sheet.id))) or 0
    sheet = Sheet(name=payload.name.strip(), sort_order=next_sort_order)
    sheet.slots = [_new_empty_slot(slot_index) for slot_index in range(GRID_SLOT_COUNT)]
    db.add(sheet)
    db.commit()
    return get_sheet(db, sheet.id)


def get_sheet(db: Session, sheet_id: int) -> SheetDetailRead:
    _ensure_default_sheet(db)
    sheet = _get_sheet_or_404(db, sheet_id)
    _ensure_sheet_slots(db, sheet)
    return _serialize_sheet_detail(sheet)


def update_sheet(db: Session, sheet_id: int, payload: SheetUpdate) -> SheetDetailRead:
    sheet = _get_sheet_or_404(db, sheet_id)

    if "name" in payload.model_fields_set and payload.name is not None:
        sheet.name = payload.name.strip()

    db.commit()
    return get_sheet(db, sheet.id)


def delete_sheet(db: Session, sheet_id: int) -> None:
    _ensure_default_sheet(db)
    sheet = _get_sheet_or_404(db, sheet_id)
    sheet_count = db.scalar(select(func.count(Sheet.id))) or 0
    if sheet_count <= 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete the last sheet",
        )

    db.delete(sheet)
    db.commit()
    _normalize_sheet_sort_order(db)


def update_sheet_slots(
    db: Session,
    sheet_id: int,
    payload: SheetSlotsUpdate,
) -> SheetDetailRead:
    sheet = _get_sheet_or_404(db, sheet_id)
    _validate_slots(db, payload.slots)
    _ensure_sheet_slots(db, sheet)

    slots_by_index = {slot.slot_index: slot for slot in sheet.slots}
    updates_by_index = {slot.slot_index: slot for slot in payload.slots}

    for slot_index in range(GRID_SLOT_COUNT):
        slot = slots_by_index[slot_index]
        update = updates_by_index.get(slot_index)
        slot.widget_key = update.widget_key if update is not None else None
        slot.config_json = update.config_json if update is not None else {}

    db.commit()
    return get_sheet(db, sheet.id)


def reset_default_sheets(db: Session) -> list[Sheet]:
    db.execute(delete(SheetWidgetSlot))
    db.execute(delete(Sheet))
    default_sheet = _create_default_sheet()
    db.add(default_sheet)
    db.commit()
    return _ordered_sheets(db)


def _ensure_default_sheet(db: Session) -> None:
    has_sheet = db.scalar(select(Sheet.id).limit(1))
    if has_sheet is not None:
        return

    db.add(_create_default_sheet())
    db.commit()


def _create_default_sheet() -> Sheet:
    sheet = Sheet(name=DEFAULT_SHEET_NAME, sort_order=0)
    sheet.slots = [
        SheetWidgetSlot(
            slot_index=slot_index,
            widget_key=DEFAULT_DASHBOARD_WIDGET_KEYS[slot_index]
            if slot_index < len(DEFAULT_DASHBOARD_WIDGET_KEYS)
            else None,
            config_json={},
        )
        for slot_index in range(GRID_SLOT_COUNT)
    ]
    return sheet


def _new_empty_slot(slot_index: int) -> SheetWidgetSlot:
    return SheetWidgetSlot(slot_index=slot_index, widget_key=None, config_json={})


def _ordered_sheets(db: Session) -> list[Sheet]:
    return list(
        db.scalars(select(Sheet).order_by(Sheet.sort_order.asc(), Sheet.id.asc()))
    )


def _get_sheet_or_404(db: Session, sheet_id: int) -> Sheet:
    sheet = db.scalar(
        select(Sheet)
        .options(selectinload(Sheet.slots))
        .where(Sheet.id == sheet_id)
    )
    if sheet is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sheet not found",
        )
    return sheet


def _ensure_sheet_slots(db: Session, sheet: Sheet) -> None:
    slots_by_index = {slot.slot_index: slot for slot in sheet.slots}
    did_change = False

    for slot_index in range(GRID_SLOT_COUNT):
        if slot_index not in slots_by_index:
            sheet.slots.append(_new_empty_slot(slot_index))
            did_change = True

    if did_change:
        db.commit()
        db.refresh(sheet)

    sheet.slots.sort(key=lambda slot: slot.slot_index)


def _serialize_sheet_detail(sheet: Sheet) -> SheetDetailRead:
    known_slots = [
        slot
        for slot in sheet.slots
        if slot.slot_index in VALID_SLOT_INDEXES
        and (slot.widget_key is None or slot.widget_key in VALID_DASHBOARD_WIDGET_KEYS)
    ]
    known_slots.sort(key=lambda slot: slot.slot_index)
    return SheetDetailRead.model_validate(
        {
            "id": sheet.id,
            "name": sheet.name,
            "sort_order": sheet.sort_order,
            "created_at": sheet.created_at,
            "updated_at": sheet.updated_at,
            "slots": known_slots,
        }
    )


def _validate_slots(db: Session, slots) -> None:
    for slot in slots:
        widget_key = slot.widget_key
        if widget_key is not None and widget_key not in VALID_DASHBOARD_WIDGET_KEYS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown dashboard widget key: {widget_key}",
            )
        if widget_key in {"daily-tasks", "weekly-tasks"}:
            _validate_task_widget_config(db, slot.config_json)


def _validate_task_widget_config(db: Session, config_json: dict) -> None:
    if "category_id" not in config_json or config_json["category_id"] is None:
        return

    category_id = config_json["category_id"]
    if not isinstance(category_id, int):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task widget category_id must be an integer",
        )

    category_exists = db.scalar(
        select(TaskCategory.id).where(TaskCategory.id == category_id)
    )
    if category_exists is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task widget category_id does not exist",
        )


def _normalize_sheet_sort_order(db: Session) -> None:
    for sort_order, sheet in enumerate(_ordered_sheets(db)):
        sheet.sort_order = sort_order
    db.commit()
