import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict


class ShiftAssignmentCreate(BaseModel):
    member_id: uuid.UUID | None = None
    academy_id: uuid.UUID | None = None
    tipo: str = "member"
    horario_id: uuid.UUID | None = None
    hora_inicio: time | None = None
    hora_fin: time | None = None
    dia_semana: int
    fecha_inicio: date
    fecha_fin: date


class ShiftBatchCreate(BaseModel):
    member_id: uuid.UUID | None = None
    academy_id: uuid.UUID | None = None
    tipo: str = "member"
    horario_id: uuid.UUID | None = None
    hora_inicio: time | None = None
    hora_fin: time | None = None
    dias_semana: list[int]
    fecha_inicio: date
    fecha_fin: date


class ShiftAssignmentUpdate(BaseModel):
    horario_id: uuid.UUID | None = None
    hora_inicio: time | None = None
    hora_fin: time | None = None
    dia_semana: int | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None


class ShiftAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    member_id: uuid.UUID | None
    academy_id: uuid.UUID | None
    tipo: str
    horario_id: uuid.UUID | None
    hora_inicio: time | None
    hora_fin: time | None
    dia_semana: int
    fecha_inicio: date
    fecha_fin: date
    created_at: datetime


class CalendarioEvento(BaseModel):
    dia_semana: int
    fecha: date
    hora_inicio: str
    hora_fin: str
    member_id: uuid.UUID | None = None
    academy_id: uuid.UUID | None = None
    tipo: str = "member"
    member_nombre: str
    horario_nombre: str
    horario_id: uuid.UUID | None = None
    assignment_id: uuid.UUID | None = None
