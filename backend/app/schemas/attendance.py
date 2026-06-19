import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AttendanceCreate(BaseModel):
    member_id: uuid.UUID | None = None
    academy_id: uuid.UUID | None = None
    observacion: str | None = None


class AttendanceUpdate(BaseModel):
    observacion: str | None = None
    ubicacion: str | None = None


class AttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    member_id: uuid.UUID | None
    academy_id: uuid.UUID | None
    tipo: str
    fecha: datetime
    hora_entrada: datetime
    ubicacion: str | None
    observacion: str | None
    registrado_por: uuid.UUID
    created_at: datetime


class AttendanceWithMember(BaseModel):
    id: uuid.UUID
    member_id: uuid.UUID | None
    academy_id: uuid.UUID | None
    tipo: str
    member_dni: str | None
    member_nombre: str
    member_apellidos: str | None
    fecha: datetime
    hora_entrada: datetime
    ubicacion: str | None
    observacion: str | None
    registrado_por: uuid.UUID
    created_at: datetime
