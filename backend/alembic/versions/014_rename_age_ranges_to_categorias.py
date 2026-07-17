"""rename age_ranges to categorias and rango_edad_id to categoria_id

Revision ID: 014
Revises: 013
Create Date: 2026-07-16
"""
from typing import Sequence, Union

from alembic import op

revision: str = "014"
down_revision: Union[str, None] = "013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("fk_members_rango_edad_id", "members", type_="foreignkey")
    op.rename_table("age_ranges", "categorias")
    op.alter_column("members", "rango_edad_id", new_column_name="categoria_id")
    op.create_foreign_key(
        "fk_members_categoria_id",
        "members", "categorias",
        ["categoria_id"], ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_members_categoria_id", "members", type_="foreignkey")
    op.alter_column("members", "categoria_id", new_column_name="rango_edad_id")
    op.rename_table("categorias", "age_ranges")
    op.create_foreign_key(
        "fk_members_rango_edad_id",
        "members", "age_ranges",
        ["rango_edad_id"], ["id"],
    )
