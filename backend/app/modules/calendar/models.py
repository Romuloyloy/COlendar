from datetime import date, time

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text, Time, false
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class CalendarEvent(TimestampMixin, Base):
    __tablename__ = "calendar_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    event_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[time | None] = mapped_column(Time(), nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time(), nullable=True)
    location: Mapped[str] = mapped_column(String(250), nullable=False, default="")
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("task_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    recurrence_type: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default="none",
        server_default="none",
    )
    weekdays: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    interval_weeks: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )
    anchor_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    day_of_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recurrence_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )
