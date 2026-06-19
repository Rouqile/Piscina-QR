import uuid
from datetime import datetime, time, timezone

from sqlalchemy import DateTime, String, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Horario(Base):
    __tablename__ = "horarios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    hora_inicio: Mapped[datetime] = mapped_column(Time, nullable=False)
    hora_fin: Mapped[datetime] = mapped_column(Time, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
