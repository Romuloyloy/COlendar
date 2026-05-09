"""add one-time task time fields

Revision ID: 20260509_0010
Revises: 20260507_0009
Create Date: 2026-05-09 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op


revision: str = "20260509_0010"
down_revision: str | None = "20260507_0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("daily_tasks", sa.Column("planned_time", sa.Time(), nullable=True))
    op.add_column("daily_tasks", sa.Column("due_date", sa.Date(), nullable=True))
    op.add_column("daily_tasks", sa.Column("due_time", sa.Time(), nullable=True))
    op.create_index(
        op.f("ix_daily_tasks_due_date"),
        "daily_tasks",
        ["due_date"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_daily_tasks_due_date"), table_name="daily_tasks")
    op.drop_column("daily_tasks", "due_time")
    op.drop_column("daily_tasks", "due_date")
    op.drop_column("daily_tasks", "planned_time")
