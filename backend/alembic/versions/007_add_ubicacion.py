"""add ubicacion to attendances, ubicaciones to pool_config

Revision ID: 007
Revises: 006
Create Date: 2026-06-02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "attendances",
        sa.Column("ubicacion", sa.String(100), nullable=True),
    )
    op.add_column(
        "pool_config",
        sa.Column("ubicaciones", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("pool_config", "ubicaciones")
    op.drop_column("attendances", "ubicacion")
