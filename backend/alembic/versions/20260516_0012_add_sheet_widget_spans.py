"""add sheet widget spans

Revision ID: 20260516_0012
Revises: 20260509_0011
Create Date: 2026-05-16
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "20260516_0012"
down_revision: str | None = "20260509_0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "sheet_widget_slots",
        sa.Column("col_span", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "sheet_widget_slots",
        sa.Column("row_span", sa.Integer(), nullable=False, server_default="1"),
    )


def downgrade() -> None:
    op.drop_column("sheet_widget_slots", "row_span")
    op.drop_column("sheet_widget_slots", "col_span")
