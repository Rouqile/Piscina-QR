import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PoolConfig(Base):
    __tablename__ = "pool_config"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    capacidad_maxima: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    ubicaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    institucion_nombre: Mapped[str | None] = mapped_column(String(300), nullable=True)
    institucion_direccion: Mapped[str | None] = mapped_column(String(500), nullable=True)
    institucion_telefono: Mapped[str | None] = mapped_column(String(50), nullable=True)
    institucion_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
