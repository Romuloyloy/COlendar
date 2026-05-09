"""add recurring task fields

Revision ID: 20260509_0011
Revises: 20260509_0010
Create Date: 2026-05-09
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "20260509_0011"
down_revision: str | None = "20260509_0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "weekly_tasks",
        sa.Column(
            "recurrence_type",
            sa.String(length=40),
            nullable=False,
            server_default="weekly",
        ),
    )
    op.add_column(
        "weekly_tasks",
        sa.Column("interval_weeks", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column("weekly_tasks", sa.Column("anchor_date", sa.Date(), nullable=True))
    op.add_column("weekly_tasks", sa.Column("day_of_month", sa.Integer(), nullable=True))
    op.add_column("weekly_tasks", sa.Column("start_date", sa.Date(), nullable=True))
    op.add_column("weekly_tasks", sa.Column("end_date", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("weekly_tasks", "end_date")
    op.drop_column("weekly_tasks", "start_date")
    op.drop_column("weekly_tasks", "day_of_month")
    op.drop_column("weekly_tasks", "anchor_date")
    op.drop_column("weekly_tasks", "interval_weeks")
    op.drop_column("weekly_tasks", "recurrence_type")
