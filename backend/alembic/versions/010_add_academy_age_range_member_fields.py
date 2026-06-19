"""add academy, age_range tables and rango_edad_id to members

Revision ID: 010
Revises: 009
Create Date: 2026-06-11
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "academies",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("num_estudiantes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "age_ranges",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("edad_min", sa.Integer(), nullable=False),
        sa.Column("edad_max", sa.Integer(), nullable=False),
        sa.Column("color", sa.String(7), nullable=False, server_default="#6366f1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.add_column(
        "members",
        sa.Column("rango_edad_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_members_rango_edad_id",
        "members", "age_ranges",
        ["rango_edad_id"], ["id"],
    )
    op.add_column(
        "shift_assignments",
        sa.Column("academy_id", sa.UUID(), nullable=True),
    )
    op.add_column(
        "shift_assignments",
        sa.Column("tipo", sa.String(10), nullable=False, server_default="member"),
    )
    op.alter_column(
        "shift_assignments", "member_id",
        existing_type=sa.UUID(),
        nullable=True,
    )
    op.create_foreign_key(
        "fk_shift_assignments_academy_id",
        "shift_assignments", "academies",
        ["academy_id"], ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_shift_assignments_academy_id", "shift_assignments", type_="foreignkey")
    op.drop_column("shift_assignments", "tipo")
    op.drop_column("shift_assignments", "academy_id")
    op.alter_column("shift_assignments", "member_id", existing_type=sa.UUID(), nullable=False)
    op.drop_constraint("fk_members_rango_edad_id", "members", type_="foreignkey")
    op.drop_column("members", "rango_edad_id")
    op.drop_table("age_ranges")
    op.drop_table("academies")
