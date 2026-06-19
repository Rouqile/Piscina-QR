import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Attendance(Base):
    __tablename__ = "attendances"

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
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    hora_entrada: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    ubicacion: Mapped[str | None] = mapped_column(String(100), nullable=True)
    observacion: Mapped[str | None] = mapped_column(Text, nullable=True)
    liberado: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    registrado_por: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    member: Mapped["Member | None"] = relationship("Member", backref="attendances")
    academy: Mapped["Academy | None"] = relationship("Academy", backref="attendances")
    registrar: Mapped["User"] = relationship("User", backref="registered_attendances")
