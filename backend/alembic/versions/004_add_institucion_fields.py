"""add institution fields to pool_config

Revision ID: 004
Revises: 003
Create Date: 2026-05-29
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pool_config", sa.Column("institucion_nombre", sa.String(300), nullable=True))
    op.add_column("pool_config", sa.Column("institucion_direccion", sa.String(500), nullable=True))
    op.add_column("pool_config", sa.Column("institucion_telefono", sa.String(50), nullable=True))
    op.add_column("pool_config", sa.Column("institucion_email", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("pool_config", "institucion_email")
    op.drop_column("pool_config", "institucion_telefono")
    op.drop_column("pool_config", "institucion_direccion")
    op.drop_column("pool_config", "institucion_nombre")
