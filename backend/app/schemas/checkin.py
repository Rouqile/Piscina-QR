import uuid
from datetime import datetime

from pydantic import BaseModel


class CheckinInfo(BaseModel):
    member_id: uuid.UUID | None = None
    academy_id: uuid.UUID | None = None
    tipo: str = "member"
    dni: str | None = None
    nombre: str
    tiene_horario_hoy: bool = False
    horario_hoy: str | None = None
    aforo_actual: int = 0
    capacidad_maxima: int = 0
    puede_entrar: bool = True
    ya_entro: bool = False
    inactivo: bool = False
    sin_horario_advertencia: bool = False


class CheckinEntry(BaseModel):
    observacion: str = ""
    ubicaciones: list[str] | None = None


class CheckinResponse(BaseModel):
    tipo: str
    attendance_id: uuid.UUID
    member_id: uuid.UUID | None = None
    academy_id: uuid.UUID | None = None
    nombre: str
    hora_entrada: str
    ubicaciones: list[str] = []
    aforo_actual: int
    capacidad_maxima: int
