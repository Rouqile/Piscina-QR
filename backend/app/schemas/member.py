import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class MemberCreate(BaseModel):
    dni: str
    codigo_unico: str | None = None
    nombre: str
    apellidos: str | None = None
    email: str | None = None
    telefono: str | None = None
    fecha_nacimiento: date | None = None
    rango_edad_id: str | None = None
    observaciones_medicas: str | None = None
    otras_observaciones: str | None = None
    is_active: bool = True


class MemberUpdate(BaseModel):
    dni: str | None = None
    codigo_unico: str | None = None
    nombre: str | None = None
    apellidos: str | None = None
    email: str | None = None
    telefono: str | None = None
    fecha_nacimiento: date | None = None
    rango_edad_id: str | None = None
    observaciones_medicas: str | None = None
    otras_observaciones: str | None = None
    is_active: bool | None = None


class MemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    dni: str
    codigo_unico: str | None
    nombre: str
    apellidos: str | None
    email: str | None
    telefono: str | None
    fecha_nacimiento: date | None
    rango_edad_id: uuid.UUID | None
    observaciones_medicas: str | None
    otras_observaciones: str | None
    foto_url: str | None
    is_active: bool
    created_at: datetime
