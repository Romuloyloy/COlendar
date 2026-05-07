"""add dashboard widget preferences

Revision ID: 20260507_0007
Revises: 20260507_0006
Create Date: 2026-05-07
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260507_0007"
down_revision: str | Sequence[str] | None = "20260507_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "dashboard_widget_preferences",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("widget_key", sa.String(length=100), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_visible", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("config_json", sa.JSON(), server_default=sa.text("'{}'"), nullable=False),
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
        sa.UniqueConstraint(
            "widget_key",
            name="uq_dashboard_widget_preferences_widget_key",
        ),
    )
    op.create_index(
        "ix_dashboard_widget_preferences_sort_order",
        "dashboard_widget_preferences",
        ["sort_order"],
    )
    op.create_index(
        "ix_dashboard_widget_preferences_widget_key",
        "dashboard_widget_preferences",
        ["widget_key"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_dashboard_widget_preferences_widget_key",
        table_name="dashboard_widget_preferences",
    )
    op.drop_index(
        "ix_dashboard_widget_preferences_sort_order",
        table_name="dashboard_widget_preferences",
    )
    op.drop_table("dashboard_widget_preferences")
