import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AcademyCreate(BaseModel):
    codigo: str
    nombre: str
    num_estudiantes: int = 0
    color: str = "#a855f7"


class AcademyUpdate(BaseModel):
    codigo: str | None = None
    nombre: str | None = None
    num_estudiantes: int | None = None
    color: str | None = None


class AcademyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    codigo: str
    nombre: str
    num_estudiantes: int
    color: str
    created_at: datetime
