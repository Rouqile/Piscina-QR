import uuid
from datetime import datetime, timezone

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Membership(Base):
    __tablename__ = "memberships"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("members.id"), nullable=False
    )
    tipo: Mapped[str] = mapped_column(
        Enum("mensual", "trimestral", "puntual", name="membership_tipo"),
        nullable=False,
    )
    fecha_inicio: Mapped[datetime] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[datetime] = mapped_column(Date, nullable=False)
    monto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    estado_pago: Mapped[str] = mapped_column(
        Enum("pagado", "pendiente", "vencido", name="payment_estado"),
        nullable=False,
        default="pagado",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    member: Mapped["Member"] = relationship("Member", backref="memberships")
    schedule_slots: Mapped[list["ScheduleSlot"]] = relationship(
        "ScheduleSlot", back_populates="membership", cascade="all, delete-orphan"
    )
