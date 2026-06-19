import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class MembershipCreate(BaseModel):
    member_id: uuid.UUID
    tipo: str
    fecha_inicio: date
    fecha_fin: date
    monto: float
    estado_pago: str = "pagado"


class MembershipUpdate(BaseModel):
    tipo: str | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    monto: float | None = None
    estado_pago: str | None = None


class MembershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    member_id: uuid.UUID
    tipo: str
    fecha_inicio: date
    fecha_fin: date
    monto: float
    estado_pago: str
    created_at: datetime
