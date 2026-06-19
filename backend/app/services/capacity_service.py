from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.crud.crud_pool_config import pool_config_crud
from app.models.attendance import Attendance


def get_current_count(db: Session) -> int:
    today = datetime.now(timezone.utc).date()
    limite = datetime.now(timezone.utc) - timedelta(hours=1)
    return (
        db.query(Attendance)
        .filter(
            func.date(Attendance.fecha) == today,
            Attendance.hora_entrada >= limite,
            Attendance.liberado.is_(None),
        )
        .count()
    )


def check_capacity(db: Session) -> tuple[bool, int, int]:
    config = pool_config_crud.get_singleton(db)
    current = get_current_count(db)
    return current < config.capacidad_maxima, current, config.capacidad_maxima
