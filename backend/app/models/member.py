import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Member(Base):
    __tablename__ = "members"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dni: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    codigo_unico: Mapped[str | None] = mapped_column(String(20), nullable=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    apellidos: Mapped[str | None] = mapped_column(String(150), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fecha_nacimiento: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    rango_edad_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("age_ranges.id"), nullable=True
    )
    observaciones_medicas: Mapped[str | None] = mapped_column(Text, nullable=True)
    otras_observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    foto_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    rango_edad: Mapped["AgeRange | None"] = relationship("AgeRange", backref="members")
