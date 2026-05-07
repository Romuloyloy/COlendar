"""add calorie entries

Revision ID: 20260507_0006
Revises: 20260507_0005
Create Date: 2026-05-07
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260507_0006"
down_revision: str | Sequence[str] | None = "20260507_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "calorie_entries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column("amount_kcal", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=250), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("is_archived", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_calorie_entries_entry_date", "calorie_entries", ["entry_date"])


def downgrade() -> None:
    op.drop_index("ix_calorie_entries_entry_date", table_name="calorie_entries")
    op.drop_table("calorie_entries")
