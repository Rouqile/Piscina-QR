import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CategoriaCreate(BaseModel):
    nombre: str
    edad_min: int
    edad_max: int
    color: str = "#6366f1"


class CategoriaUpdate(BaseModel):
    nombre: str | None = None
    edad_min: int | None = None
    edad_max: int | None = None
    color: str | None = None


class CategoriaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    edad_min: int
    edad_max: int
    color: str
    created_at: datetime
