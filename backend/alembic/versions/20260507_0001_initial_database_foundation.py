"""initial database foundation

Revision ID: 20260507_0001
Revises:
Create Date: 2026-05-07
"""

from collections.abc import Sequence

revision: str = "20260507_0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # No product tables yet. Applying this stamps the database foundation.
    pass


def downgrade() -> None:
    pass
