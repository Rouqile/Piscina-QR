from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.crud.crud_member import member_crud
from app.crud.crud_academy import academy_crud
from app.crud.crud_shift_assignment import shift_assignment_crud
from app.models.attendance import Attendance
from app.services.capacity_service import check_capacity


def get_checkin_info(db: Session, identifier: str):
    member = member_crud.get_by_dni(db, identifier)
    if member:
        return _get_member_info(db, member)

    academy = academy_crud.get_by_codigo(db, identifier)
    if academy:
        return _get_academy_info(db, academy)

    from uuid import UUID
    try:
        academy_id = UUID(identifier)
        academy = academy_crud.get(db, str(academy_id))
        if academy:
            return _get_academy_info(db, academy)
    except (ValueError, AttributeError):
        pass

    return None


def _get_member_info(db: Session, member):
    if not member.is_active:
        return {
            "member_id": str(member.id), "academy_id": None, "tipo": "member",
            "dni": member.dni,
            "nombre": f"{member.nombre} {member.apellidos or ''}".strip(),
            "tiene_horario_hoy": False, "horario_hoy": None,
            "aforo_actual": 0, "capacidad_maxima": 0,
            "puede_entrar": False, "ya_entro": False,
            "inactivo": True, "sin_horario_advertencia": False,
        }

    today = datetime.now(timezone.utc)
    dia_semana = today.weekday()
    hoy = today.date()

    assignments = shift_assignment_crud.get_by_member_and_day(
        db, str(member.id), dia_semana, hoy
    )

    tiene_horario = len(assignments) > 0
    horario_hoy = None
    if tiene_horario:
        a = assignments[0]
        if a.hora_inicio and a.hora_fin:
            h_ini = a.hora_inicio.strftime('%H:%M')
            h_fin = a.hora_fin.strftime('%H:%M')
        elif a.horario:
            h_ini = a.horario.hora_inicio.strftime('%H:%M')
            h_fin = a.horario.hora_fin.strftime('%H:%M')
        else:
            h_ini = "--:--"
            h_fin = "--:--"
        horario_hoy = f"{h_ini} - {h_fin}"

    puede_entrar, aforo_actual, capacidad = check_capacity(db)

    existing = (
        db.query(Attendance)
        .filter(
            Attendance.member_id == member.id,
            func.date(Attendance.fecha) == hoy,
        )
        .first()
    )

    return {
        "member_id": str(member.id), "academy_id": None, "tipo": "member",
        "dni": member.dni,
        "nombre": f"{member.nombre} {member.apellidos or ''}".strip(),
        "tiene_horario_hoy": tiene_horario,
        "horario_hoy": horario_hoy,
        "aforo_actual": aforo_actual,
        "capacidad_maxima": capacidad,
        "puede_entrar": not bool(existing) and puede_entrar,
        "ya_entro": bool(existing),
        "inactivo": False,
        "sin_horario_advertencia": not tiene_horario,
    }


def _get_academy_info(db: Session, academy):
    hoy = datetime.now(timezone.utc).date()

    existing = (
        db.query(Attendance)
        .filter(
            Attendance.academy_id == academy.id,
            func.date(Attendance.fecha) == hoy,
        )
        .first()
    )

    return {
        "member_id": None, "academy_id": str(academy.id), "tipo": "academy",
        "dni": None,
        "nombre": academy.nombre,
        "tiene_horario_hoy": False,
        "horario_hoy": None,
        "aforo_actual": 0,
        "capacidad_maxima": 0,
        "puede_entrar": not bool(existing),
        "ya_entro": bool(existing),
        "inactivo": False,
        "sin_horario_advertencia": False,
    }


def register_entry(
    db: Session,
    member_id: str | None = None,
    academy_id: str | None = None,
    registrado_por: str | None = None,
    observacion: str | None = None,
    ubicacion: str | None = None,
) -> Attendance | None:
    now = datetime.now(timezone.utc)
    attendance = Attendance(
        member_id=member_id,
        academy_id=academy_id,
        tipo="academy" if academy_id else "member",
        fecha=now,
        hora_entrada=now,
        ubicacion=ubicacion,
        observacion=observacion,
        registrado_por=registrado_por,
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance
