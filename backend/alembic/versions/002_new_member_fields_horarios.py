"""add member fields, horarios, shift_assignments

Revision ID: 002
Revises: 001
Create Date: 2026-05-29
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("members", sa.Column("apellidos", sa.String(150), nullable=True))
    op.add_column("members", sa.Column("fecha_nacimiento", sa.Date(), nullable=True))
    op.add_column(
        "members", sa.Column("observaciones_medicas", sa.Text(), nullable=True)
    )
    op.add_column(
        "members", sa.Column("otras_observaciones", sa.Text(), nullable=True)
    )

    op.create_table(
        "horarios",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("hora_inicio", sa.Time(), nullable=False),
        sa.Column("hora_fin", sa.Time(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "shift_assignments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("member_id", sa.UUID(), nullable=False),
        sa.Column("horario_id", sa.UUID(), nullable=False),
        sa.Column("dia_semana", sa.Integer(), nullable=False),
        sa.Column("fecha_inicio", sa.Date(), nullable=False),
        sa.Column("fecha_fin", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["member_id"], ["members.id"]),
        sa.ForeignKeyConstraint(["horario_id"], ["horarios.id"]),
    )


def downgrade() -> None:
    op.drop_table("shift_assignments")
    op.drop_table("horarios")
    op.drop_column("members", "otras_observaciones")
    op.drop_column("members", "observaciones_medicas")
    op.drop_column("members", "fecha_nacimiento")
    op.drop_column("members", "apellidos")
