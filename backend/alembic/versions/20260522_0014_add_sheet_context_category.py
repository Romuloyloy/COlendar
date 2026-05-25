"""add sheet context category

Revision ID: 20260522_0014
Revises: 20260520_0013
Create Date: 2026-05-22 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "20260522_0014"
down_revision: Union[str, None] = "20260520_0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sheets",
        sa.Column("context_category_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        "ix_sheets_context_category_id",
        "sheets",
        ["context_category_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_sheets_context_category_id_task_categories",
        "sheets",
        "task_categories",
        ["context_category_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_sheets_context_category_id_task_categories",
        "sheets",
        type_="foreignkey",
    )
    op.drop_index("ix_sheets_context_category_id", table_name="sheets")
    op.drop_column("sheets", "context_category_id")
