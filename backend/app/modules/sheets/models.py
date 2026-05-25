from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.modules.tasks.models import TaskCategory


class Sheet(TimestampMixin, Base):
    __tablename__ = "sheets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    context_category_id: Mapped[int | None] = mapped_column(
        ForeignKey("task_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    slots: Mapped[list["SheetWidgetSlot"]] = relationship(
        "SheetWidgetSlot",
        back_populates="sheet",
        cascade="all, delete-orphan",
        order_by="SheetWidgetSlot.slot_index",
    )
    context_category: Mapped["TaskCategory | None"] = relationship("TaskCategory")


class SheetWidgetSlot(TimestampMixin, Base):
    __tablename__ = "sheet_widget_slots"
    __table_args__ = (
        UniqueConstraint("sheet_id", "slot_index", name="uq_sheet_widget_slots_index"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sheet_id: Mapped[int] = mapped_column(
        ForeignKey("sheets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    widget_key: Mapped[str | None] = mapped_column(String(100), nullable=True)
    config_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    slot_index: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    col_span: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    row_span: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    sheet: Mapped[Sheet] = relationship("Sheet", back_populates="slots")
