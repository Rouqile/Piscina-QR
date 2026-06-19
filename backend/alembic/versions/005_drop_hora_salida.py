"""drop hora_salida from attendances

Revision ID: 005
Revises: 004
Create Date: 2026-05-29
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("attendances", "hora_salida")


def downgrade() -> None:
    op.add_column(
        "attendances",
        sa.Column("hora_salida", sa.DateTime(timezone=True), nullable=True),
    )
