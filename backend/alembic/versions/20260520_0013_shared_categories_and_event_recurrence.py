"""shared categories and calendar event recurrence

Revision ID: 20260520_0013
Revises: 20260516_0012
Create Date: 2026-05-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "20260520_0013"
down_revision: str | None = "20260516_0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("notes", sa.Column("category_id", sa.Integer(), nullable=True))
    op.create_index("ix_notes_category_id", "notes", ["category_id"])
    op.create_foreign_key(
        "fk_notes_category_id_task_categories",
        "notes",
        "task_categories",
        ["category_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column("calendar_events", sa.Column("category_id", sa.Integer(), nullable=True))
    op.add_column(
        "calendar_events",
        sa.Column("recurrence_type", sa.String(length=40), nullable=False, server_default="none"),
    )
    op.add_column(
        "calendar_events",
        sa.Column("weekdays", sa.String(length=20), nullable=False, server_default=""),
    )
    op.add_column(
        "calendar_events",
        sa.Column("interval_weeks", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column("calendar_events", sa.Column("anchor_date", sa.Date(), nullable=True))
    op.add_column("calendar_events", sa.Column("day_of_month", sa.Integer(), nullable=True))
    op.add_column(
        "calendar_events",
        sa.Column("recurrence_end_date", sa.Date(), nullable=True),
    )
    op.create_index("ix_calendar_events_category_id", "calendar_events", ["category_id"])
    op.create_foreign_key(
        "fk_calendar_events_category_id_task_categories",
        "calendar_events",
        "task_categories",
        ["category_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_calendar_events_category_id_task_categories",
        "calendar_events",
        type_="foreignkey",
    )
    op.drop_index("ix_calendar_events_category_id", table_name="calendar_events")
    op.drop_column("calendar_events", "recurrence_end_date")
    op.drop_column("calendar_events", "day_of_month")
    op.drop_column("calendar_events", "anchor_date")
    op.drop_column("calendar_events", "interval_weeks")
    op.drop_column("calendar_events", "weekdays")
    op.drop_column("calendar_events", "recurrence_type")
    op.drop_column("calendar_events", "category_id")

    op.drop_constraint(
        "fk_notes_category_id_task_categories",
        "notes",
        type_="foreignkey",
    )
    op.drop_index("ix_notes_category_id", table_name="notes")
    op.drop_column("notes", "category_id")
