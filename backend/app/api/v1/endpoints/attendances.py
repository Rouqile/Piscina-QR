import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.crud.crud_attendance import attendance_crud
from app.db.session import get_db
from app.models.attendance import Attendance
from app.models.member import Member
from app.models.academy import Academy
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceResponse,
    AttendanceUpdate,
    AttendanceWithMember,
)

router = APIRouter(prefix="/attendances", tags=["attendances"])


def _parse_ubic(ubicacion_raw: str | None) -> list[str]:
    if not ubicacion_raw:
        return []
    try:
        p = json.loads(ubicacion_raw)
        return p if isinstance(p, list) else [str(p)]
    except (json.JSONDecodeError, TypeError):
        return [str(ubicacion_raw)] if ubicacion_raw else []


@router.get("/", response_model=list[AttendanceResponse])
def list_attendances(
    member_id: str = "",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    if member_id:
        return attendance_crud.get_by_member(db, member_id, skip, limit)
    return attendance_crud.get_all(db, skip, limit)


@router.get("/today", response_model=list[AttendanceWithMember])
def today_attendances(
    search: str = Query(""),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    today = datetime.now(timezone.utc).date()

    query = (
        db.query(
            Attendance, Member.dni, Member.nombre, Member.apellidos,
            Academy.nombre.label("academy_nombre"),
        )
        .outerjoin(Member, Attendance.member_id == Member.id)
        .outerjoin(Academy, Attendance.academy_id == Academy.id)
        .filter(func.date(Attendance.fecha) == today)
        .order_by(Attendance.hora_entrada.desc())
    )

    if search:
        query = query.filter(
            Member.nombre.ilike(f"%{search}%")
            | Member.apellidos.ilike(f"%{search}%")
            | Member.dni.ilike(f"%{search}%")
            | Academy.nombre.ilike(f"%{search}%")
        )

    rows = query.all()
    result = []
    for a in rows:
        ubicaciones = _parse_ubic(a.Attendance.ubicacion)
        if a.Attendance.tipo == "academy":
            nombre = a.academy_nombre or "Academia"
            dni = a.academy_nombre or "-"
        else:
            nombre = f"{a.nombre or ''} {a.apellidos or ''}".strip()
            dni = a.dni or "-"

        result.append(
            AttendanceWithMember(
                id=a.Attendance.id,
                member_id=a.Attendance.member_id,
                academy_id=a.Attendance.academy_id,
                tipo=a.Attendance.tipo,
                member_dni=dni,
                member_nombre=nombre,
                member_apellidos=a.apellidos,
                fecha=a.Attendance.fecha,
                hora_entrada=a.Attendance.hora_entrada,
                ubicacion=json.dumps(ubicaciones) if ubicaciones else None,
                observacion=a.Attendance.observacion,
                registrado_por=a.Attendance.registrado_por,
                created_at=a.Attendance.created_at,
            )
        )
    return result


@router.put("/{attendance_id}/ubicaciones")
def update_ubicaciones(
    attendance_id: str,
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    attendance = attendance_crud.get(db, attendance_id)
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asistencia no encontrada",
        )
    ubicaciones = body.get("ubicaciones", [])
    attendance.ubicacion = json.dumps(ubicaciones) if ubicaciones else None
    db.commit()
    return {"ok": True, "ubicaciones": ubicaciones}


@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: str,
    body: AttendanceUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    attendance = attendance_crud.get(db, attendance_id)
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asistencia no encontrada",
        )
    return attendance_crud.update(db, attendance, body)


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(
    attendance_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    attendance = attendance_crud.get(db, attendance_id)
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asistencia no encontrada",
        )
    attendance_crud.remove(db, attendance_id)
