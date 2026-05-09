from datetime import date, datetime, time

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, Time, UniqueConstraint, false, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class TaskCategory(TimestampMixin, Base):
    __tablename__ = "task_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    color: Mapped[str] = mapped_column(String(40), nullable=False, default="")
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )


class DailyTask(TimestampMixin, Base):
    __tablename__ = "daily_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    task_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    planned_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    due_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("task_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
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
    category: Mapped[TaskCategory | None] = relationship("TaskCategory")


class WeeklyTask(TimestampMixin, Base):
    __tablename__ = "weekly_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    weekdays: Mapped[str] = mapped_column(String(20), nullable=False)
    recurrence_type: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default="weekly",
        server_default="weekly",
    )
    interval_weeks: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )
    anchor_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    day_of_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("task_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
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
    category: Mapped[TaskCategory | None] = relationship("TaskCategory")


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
