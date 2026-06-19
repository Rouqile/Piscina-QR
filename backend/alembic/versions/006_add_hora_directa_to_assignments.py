"""add hora_inicio/fin to shift_assignments, make horario_id nullable

Revision ID: 006
Revises: 005
Create Date: 2026-05-29
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "shift_assignments",
        sa.Column("hora_inicio", sa.Time(), nullable=True),
    )
    op.add_column(
        "shift_assignments",
        sa.Column("hora_fin", sa.Time(), nullable=True),
    )
    op.alter_column("shift_assignments", "horario_id", nullable=True)


def downgrade() -> None:
    op.alter_column("shift_assignments", "horario_id", nullable=False)
    op.drop_column("shift_assignments", "hora_fin")
    op.drop_column("shift_assignments", "hora_inicio")
