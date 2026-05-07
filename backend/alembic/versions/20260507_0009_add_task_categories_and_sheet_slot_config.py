"""add task categories and sheet slot config

Revision ID: 20260507_0009
Revises: 20260507_0008
Create Date: 2026-05-07
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260507_0009"
down_revision: str | Sequence[str] | None = "20260507_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "task_categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("color", sa.String(length=40), nullable=False),
        sa.Column("is_archived", sa.Boolean(), server_default=sa.false(), nullable=False),
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
    op.create_index("ix_task_categories_name", "task_categories", ["name"])

    op.add_column("daily_tasks", sa.Column("category_id", sa.Integer(), nullable=True))
    op.create_index("ix_daily_tasks_category_id", "daily_tasks", ["category_id"])
    op.create_foreign_key(
        "fk_daily_tasks_category_id_task_categories",
        "daily_tasks",
        "task_categories",
        ["category_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column("weekly_tasks", sa.Column("category_id", sa.Integer(), nullable=True))
    op.create_index("ix_weekly_tasks_category_id", "weekly_tasks", ["category_id"])
    op.create_foreign_key(
        "fk_weekly_tasks_category_id_task_categories",
        "weekly_tasks",
        "task_categories",
        ["category_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column(
        "sheet_widget_slots",
        sa.Column(
            "config_json",
            sa.JSON(),
            server_default=sa.text("'{}'"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("sheet_widget_slots", "config_json")

    op.drop_constraint(
        "fk_weekly_tasks_category_id_task_categories",
        "weekly_tasks",
        type_="foreignkey",
    )
    op.drop_index("ix_weekly_tasks_category_id", table_name="weekly_tasks")
    op.drop_column("weekly_tasks", "category_id")

    op.drop_constraint(
        "fk_daily_tasks_category_id_task_categories",
        "daily_tasks",
        type_="foreignkey",
    )
    op.drop_index("ix_daily_tasks_category_id", table_name="daily_tasks")
    op.drop_column("daily_tasks", "category_id")

    op.drop_index("ix_task_categories_name", table_name="task_categories")
    op.drop_table("task_categories")
