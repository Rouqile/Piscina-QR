import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    nombre: str
    rol: str = "recepcionista"


class UserUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    password: str | None = None
    nombre: str | None = None
    rol: str | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    email: str
    nombre: str
    rol: str
    is_active: bool
    created_at: datetime
