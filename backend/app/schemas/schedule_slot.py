import uuid
from datetime import datetime, time

from pydantic import BaseModel, ConfigDict


class ScheduleSlotCreate(BaseModel):
    membership_id: uuid.UUID
    dia_semana: int
    hora_inicio: time
    hora_fin: time


class ScheduleSlotBatchCreate(BaseModel):
    membership_id: uuid.UUID
    slots: list[ScheduleSlotCreate]


class ScheduleSlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    membership_id: uuid.UUID
    dia_semana: int
    hora_inicio: time
    hora_fin: time
    created_at: datetime
