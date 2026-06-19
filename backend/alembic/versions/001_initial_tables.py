"""initial tables

Revision ID: 001
Revises:
Create Date: 2026-05-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("nombre", sa.String(150), nullable=False),
        sa.Column(
            "rol",
            sa.Enum("admin", "recepcionista", name="user_rol"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "members",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("dni", sa.String(20), nullable=False),
        sa.Column("nombre", sa.String(150), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("telefono", sa.String(20), nullable=True),
        sa.Column("foto_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("dni"),
    )
    op.create_index("ix_members_dni", "members", ["dni"])

    op.create_table(
        "pool_config",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("capacidad_maxima", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "memberships",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("member_id", sa.UUID(), nullable=False),
        sa.Column(
            "tipo",
            sa.Enum("mensual", "trimestral", "puntual", name="membership_tipo"),
            nullable=False,
        ),
        sa.Column("fecha_inicio", sa.Date(), nullable=False),
        sa.Column("fecha_fin", sa.Date(), nullable=False),
        sa.Column("monto", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "estado_pago",
            sa.Enum("pagado", "pendiente", "vencido", name="payment_estado"),
            nullable=False,
            server_default="pagado",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["member_id"], ["members.id"]),
    )

    op.create_table(
        "schedule_slots",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("membership_id", sa.UUID(), nullable=False),
        sa.Column("dia_semana", sa.Integer(), nullable=False),
        sa.Column("hora_inicio", sa.Time(), nullable=False),
        sa.Column("hora_fin", sa.Time(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["membership_id"], ["memberships.id"]),
    )

    op.create_table(
        "attendances",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("member_id", sa.UUID(), nullable=False),
        sa.Column("fecha", sa.DateTime(timezone=True), nullable=False),
        sa.Column("hora_entrada", sa.DateTime(timezone=True), nullable=False),
        sa.Column("observacion", sa.Text(), nullable=True),
        sa.Column("registrado_por", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["member_id"], ["members.id"]),
        sa.ForeignKeyConstraint(["registrado_por"], ["users.id"]),
    )


def downgrade() -> None:
    op.drop_table("attendances")
    op.drop_table("schedule_slots")
    op.drop_table("memberships")
    op.drop_table("pool_config")
    op.drop_table("members")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS user_rol")
    op.execute("DROP TYPE IF EXISTS membership_tipo")
    op.execute("DROP TYPE IF EXISTS payment_estado")
