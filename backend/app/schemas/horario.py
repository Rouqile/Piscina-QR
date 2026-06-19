import uuid
from datetime import datetime, time

from pydantic import BaseModel, ConfigDict


class HorarioCreate(BaseModel):
    nombre: str
    hora_inicio: time
    hora_fin: time


class HorarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    hora_inicio: time
    hora_fin: time
    created_at: datetime
