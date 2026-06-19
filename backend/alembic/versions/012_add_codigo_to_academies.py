"""add codigo to academies

Revision ID: 012
Revises: 011
Create Date: 2026-06-11
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "academies",
        sa.Column("codigo", sa.String(50), nullable=False, server_default=""),
    )
    op.create_unique_constraint("uq_academies_codigo", "academies", ["codigo"])


def downgrade() -> None:
    op.drop_constraint("uq_academies_codigo", "academies", type_="unique")
    op.drop_column("academies", "codigo")
