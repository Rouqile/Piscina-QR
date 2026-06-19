import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict


class PoolConfigUpdate(BaseModel):
    capacidad_maxima: int | None = None
    ubicaciones: list[dict[str, Any]] | None = None
    institucion_nombre: str | None = None
    institucion_direccion: str | None = None
    institucion_telefono: str | None = None
    institucion_email: str | None = None


class PoolConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    capacidad_maxima: int
    ubicaciones: Any = None
    institucion_nombre: str | None
    institucion_direccion: str | None
    institucion_telefono: str | None
    institucion_email: str | None
