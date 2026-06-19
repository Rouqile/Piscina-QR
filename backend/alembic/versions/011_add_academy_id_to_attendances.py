"""add academy_id and tipo to attendances

Revision ID: 011
Revises: 010
Create Date: 2026-06-11
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "attendances",
        sa.Column("academy_id", sa.UUID(), nullable=True),
    )
    op.add_column(
        "attendances",
        sa.Column("tipo", sa.String(10), nullable=False, server_default="member"),
    )
    op.alter_column(
        "attendances", "member_id",
        existing_type=sa.UUID(),
        nullable=True,
    )
    op.create_foreign_key(
        "fk_attendances_academy_id",
        "attendances", "academies",
        ["academy_id"], ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_attendances_academy_id", "attendances", type_="foreignkey")
    op.alter_column("attendances", "member_id", existing_type=sa.UUID(), nullable=False)
    op.drop_column("attendances", "tipo")
    op.drop_column("attendances", "academy_id")
