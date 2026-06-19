import uuid
from datetime import date, datetime, time, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ShiftAssignment(Base):
    __tablename__ = "shift_assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    member_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("members.id"), nullable=True
    )
    academy_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("academies.id"), nullable=True
    )
    tipo: Mapped[str] = mapped_column(String(10), nullable=False, default="member")
    horario_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("horarios.id"), nullable=True
    )
    hora_inicio: Mapped[datetime | None] = mapped_column(Time, nullable=True)
    hora_fin: Mapped[datetime | None] = mapped_column(Time, nullable=True)
    dia_semana: Mapped[int] = mapped_column(Integer, nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    member: Mapped["Member | None"] = relationship("Member", backref="shift_assignments")
    academy: Mapped["Academy | None"] = relationship("Academy", backref="assignments")
    horario: Mapped["Horario | None"] = relationship("Horario", backref="assignments")
