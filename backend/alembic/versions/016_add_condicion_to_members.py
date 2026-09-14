"""add tiene_condicion and condicion columns to members

Revision ID: 016
Revises: 015
Create Date: 2026-09-09
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "016"
down_revision: Union[str, None] = "015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "members",
        sa.Column(
            "tiene_condicion",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "members",
        sa.Column("condicion", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("members", "condicion")
    op.drop_column("members", "tiene_condicion")
