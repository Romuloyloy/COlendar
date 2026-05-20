from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, selectinload

from app.modules.dashboard.widget_catalog import VALID_DASHBOARD_WIDGET_KEYS
from app.modules.sheets.models import Sheet, SheetWidgetSlot
from app.modules.sheets.schemas import (
    SheetCreate,
    SheetDetailRead,
    SheetSlotsUpdate,
    SheetUpdate,
)
from app.modules.tasks.models import TaskCategory

GRID_SLOT_COUNT = 8
GRID_COLUMNS = 4
GRID_ROWS = 2
ALLOWED_SPANS = {(1, 1), (2, 1), (1, 2), (2, 2)}
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
        slot.config_json = update.config_json if update is not None and update.widget_key else {}
        slot.col_span = update.col_span if update is not None and update.widget_key else 1
        slot.row_span = update.row_span if update is not None and update.widget_key else 1

    db.commit()
    return get_sheet(db, sheet.id)


def move_sheet_left(db: Session, sheet_id: int) -> list[Sheet]:
    return _move_sheet(db, sheet_id, direction=-1)


def move_sheet_right(db: Session, sheet_id: int) -> list[Sheet]:
    return _move_sheet(db, sheet_id, direction=1)


def reset_default_sheets(db: Session) -> list[Sheet]:
    db.execute(delete(SheetWidgetSlot))
    db.execute(delete(Sheet))
    db.add_all(_create_default_sheets(db))
    db.commit()
    return _ordered_sheets(db)


def _ensure_default_sheet(db: Session) -> None:
    has_sheet = db.scalar(select(Sheet.id).limit(1))
    if has_sheet is not None:
        return

    db.add_all(_create_default_sheets(db))
    db.commit()


def _create_default_sheets(db: Session) -> list[Sheet]:
    health_category_id = _find_active_health_category_id(db)
    return [
        _configured_sheet(
            name="Today",
            sort_order=0,
            widget_keys=[
                "today-overview",
                "daily-tasks",
                "weekly-tasks",
                "upcoming-events",
                "recent-notes",
                "tracker-summary",
                "quick-actions",
                "planning-summary",
            ],
        ),
        _configured_sheet(
            name="Planning",
            sort_order=1,
            widget_keys=[
                "today-overview",
                "daily-tasks",
                "weekly-tasks",
                "upcoming-events",
                "planning-summary",
                "recent-notes",
                "quick-actions",
                None,
            ],
        ),
        _configured_sheet(
            name="Health",
            sort_order=2,
            widget_keys=[
                "tracker-summary",
                "daily-tasks",
                "weekly-tasks",
                "today-overview",
                "quick-actions",
                None,
                None,
                None,
            ],
            task_config={
                "category_id": health_category_id,
                "title_override": "Health Tasks" if health_category_id else "",
            },
        ),
    ]


def _configured_sheet(
    *,
    name: str,
    sort_order: int,
    widget_keys: list[str | None],
    task_config: dict | None = None,
) -> Sheet:
    sheet = Sheet(name=name, sort_order=sort_order)
    sheet.slots = [
        SheetWidgetSlot(
            slot_index=slot_index,
            widget_key=widget_keys[slot_index]
            if slot_index < len(widget_keys)
            else None,
            config_json=_default_slot_config(
                widget_keys[slot_index] if slot_index < len(widget_keys) else None,
                task_config,
            ),
            col_span=1,
            row_span=1,
        )
        for slot_index in range(GRID_SLOT_COUNT)
    ]
    return sheet


def _default_slot_config(widget_key: str | None, task_config: dict | None) -> dict:
    if widget_key not in {"daily-tasks", "weekly-tasks"} or task_config is None:
        return {}
    return task_config.copy()


def _find_active_health_category_id(db: Session) -> int | None:
    return db.scalar(
        select(TaskCategory.id)
        .where(
            func.lower(TaskCategory.name) == "health",
            TaskCategory.is_archived.is_(False),
        )
        .order_by(TaskCategory.id.asc())
        .limit(1)
    )


def _new_empty_slot(slot_index: int) -> SheetWidgetSlot:
    return SheetWidgetSlot(
        slot_index=slot_index,
        widget_key=None,
        config_json={},
        col_span=1,
        row_span=1,
    )


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
        else:
            slot = slots_by_index[slot_index]
            if slot.col_span is None:
                slot.col_span = 1
                did_change = True
            if slot.row_span is None:
                slot.row_span = 1
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
    occupied_cells: dict[int, int] = {}

    for slot in slots:
        widget_key = slot.widget_key
        if widget_key is not None and widget_key not in VALID_DASHBOARD_WIDGET_KEYS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown dashboard widget key: {widget_key}",
            )
        if widget_key in {"daily-tasks", "weekly-tasks"}:
            _validate_task_widget_config(db, slot.config_json)
        if widget_key is not None:
            _validate_slot_span(slot, occupied_cells)


def _validate_slot_span(slot, occupied_cells: dict[int, int]) -> None:
    span = (slot.col_span, slot.row_span)
    if span not in ALLOWED_SPANS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sheet widget size must be 1x1, 2x1, 1x2, or 2x2",
        )

    start_column = slot.slot_index % GRID_COLUMNS
    start_row = slot.slot_index // GRID_COLUMNS
    if start_column + slot.col_span > GRID_COLUMNS or start_row + slot.row_span > GRID_ROWS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sheet widget span does not fit in the grid",
        )

    for row_offset in range(slot.row_span):
        for column_offset in range(slot.col_span):
            occupied_index = (
                (start_row + row_offset) * GRID_COLUMNS
                + start_column
                + column_offset
            )
            if occupied_index in occupied_cells:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Sheet widget spans cannot overlap",
                )
            occupied_cells[occupied_index] = slot.slot_index


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


def _move_sheet(db: Session, sheet_id: int, direction: int) -> list[Sheet]:
    _ensure_default_sheet(db)
    sheets = _ordered_sheets(db)
    sheet_index = next(
        (index for index, sheet in enumerate(sheets) if sheet.id == sheet_id),
        None,
    )
    if sheet_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sheet not found",
        )

    target_index = sheet_index + direction
    if target_index < 0 or target_index >= len(sheets):
        _normalize_sheet_sort_order(db)
        return _ordered_sheets(db)

    sheets[sheet_index].sort_order, sheets[target_index].sort_order = (
        sheets[target_index].sort_order,
        sheets[sheet_index].sort_order,
    )
    db.commit()
    _normalize_sheet_sort_order(db)
    return _ordered_sheets(db)
