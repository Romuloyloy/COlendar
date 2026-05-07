"""add tasks

Revision ID: 20260507_0003
Revises: 20260507_0002
Create Date: 2026-05-07
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260507_0003"
down_revision: str | Sequence[str] | None = "20260507_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "daily_tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=250), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("task_date", sa.Date(), nullable=False),
        sa.Column("is_completed", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_archived", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_daily_tasks_task_date", "daily_tasks", ["task_date"])

    op.create_table(
        "weekly_tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=250), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("weekdays", sa.String(length=20), nullable=False),
        sa.Column("is_archived", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "weekly_task_completions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("weekly_task_id", sa.Integer(), nullable=False),
        sa.Column("completion_date", sa.Date(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["weekly_task_id"], ["weekly_tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("weekly_task_id", "completion_date", name="uq_weekly_task_completion_date"),
    )
    op.create_index(
        "ix_weekly_task_completions_weekly_task_id",
        "weekly_task_completions",
        ["weekly_task_id"],
    )
    op.create_index(
        "ix_weekly_task_completions_completion_date",
        "weekly_task_completions",
        ["completion_date"],
    )


def downgrade() -> None:
    op.drop_index("ix_weekly_task_completions_completion_date", table_name="weekly_task_completions")
    op.drop_index("ix_weekly_task_completions_weekly_task_id", table_name="weekly_task_completions")
    op.drop_table("weekly_task_completions")
    op.drop_table("weekly_tasks")
    op.drop_index("ix_daily_tasks_task_date", table_name="daily_tasks")
    op.drop_table("daily_tasks")
