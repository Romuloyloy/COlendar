from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, false, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class DailyTask(TimestampMixin, Base):
    __tablename__ = "daily_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    task_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    is_completed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )


class WeeklyTask(TimestampMixin, Base):
    __tablename__ = "weekly_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    weekdays: Mapped[str] = mapped_column(String(20), nullable=False)
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )

    completions: Mapped[list["WeeklyTaskCompletion"]] = relationship(
        "WeeklyTaskCompletion",
        back_populates="weekly_task",
    )


class WeeklyTaskCompletion(TimestampMixin, Base):
    __tablename__ = "weekly_task_completions"
    __table_args__ = (
        UniqueConstraint(
            "weekly_task_id",
            "completion_date",
            name="uq_weekly_task_completion_date",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    weekly_task_id: Mapped[int] = mapped_column(
        ForeignKey("weekly_tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    completion_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    weekly_task: Mapped[WeeklyTask] = relationship(
        "WeeklyTask",
        back_populates="completions",
    )
