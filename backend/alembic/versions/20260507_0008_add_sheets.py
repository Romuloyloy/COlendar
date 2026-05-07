"""add sheets

Revision ID: 20260507_0008
Revises: 20260507_0007
Create Date: 2026-05-07
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260507_0008"
down_revision: str | Sequence[str] | None = "20260507_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sheets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sheets_sort_order", "sheets", ["sort_order"])

    op.create_table(
        "sheet_widget_slots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sheet_id", sa.Integer(), nullable=False),
        sa.Column("widget_key", sa.String(length=100), nullable=True),
        sa.Column("slot_index", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["sheet_id"], ["sheets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sheet_id", "slot_index", name="uq_sheet_widget_slots_index"),
    )
    op.create_index("ix_sheet_widget_slots_sheet_id", "sheet_widget_slots", ["sheet_id"])
    op.create_index(
        "ix_sheet_widget_slots_slot_index",
        "sheet_widget_slots",
        ["slot_index"],
    )


def downgrade() -> None:
    op.drop_index("ix_sheet_widget_slots_slot_index", table_name="sheet_widget_slots")
    op.drop_index("ix_sheet_widget_slots_sheet_id", table_name="sheet_widget_slots")
    op.drop_table("sheet_widget_slots")
    op.drop_index("ix_sheets_sort_order", table_name="sheets")
    op.drop_table("sheets")
