from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SheetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    context_category_id: int | None = None

    @field_validator("name")
    @classmethod
    def name_cannot_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Sheet name cannot be empty")
        return value.strip()


class SheetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    context_category_id: int | None = None

    @field_validator("name")
    @classmethod
    def name_cannot_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Sheet name cannot be empty")
        return value.strip() if value is not None else value


class SheetWidgetSlotRead(BaseModel):
    id: int
    sheet_id: int
    widget_key: str | None
    config_json: dict
    slot_index: int
    col_span: int
    row_span: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SheetWidgetSlotUpdate(BaseModel):
    slot_index: int = Field(ge=0, le=7)
    widget_key: str | None = Field(default=None, max_length=100)
    config_json: dict = Field(default_factory=dict)
    col_span: int = Field(default=1, ge=1, le=2)
    row_span: int = Field(default=1, ge=1, le=2)

    @field_validator("widget_key")
    @classmethod
    def widget_key_cannot_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Widget key cannot be empty")
        return value.strip() if value is not None else value


class SheetRead(BaseModel):
    id: int
    name: str
    sort_order: int
    context_category_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SheetDetailRead(SheetRead):
    slots: list[SheetWidgetSlotRead]


class SheetSlotsUpdate(BaseModel):
    slots: list[SheetWidgetSlotUpdate] = Field(max_length=8)

    @field_validator("slots")
    @classmethod
    def slots_must_be_unique_and_predictable(
        cls,
        value: list[SheetWidgetSlotUpdate],
    ) -> list[SheetWidgetSlotUpdate]:
        slot_indexes = [slot.slot_index for slot in value]
        if len(slot_indexes) != len(set(slot_indexes)):
            raise ValueError("Sheet slot indexes must be unique")

        return value
