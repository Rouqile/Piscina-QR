"""add color to academies

Revision ID: 013
Revises: 012
Create Date: 2026-06-11
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "academies",
        sa.Column("color", sa.String(7), nullable=False, server_default="#a855f7"),
    )


def downgrade() -> None:
    op.drop_column("academies", "color")
