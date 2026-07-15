import json
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud.crud_pool_config import pool_config_crud
from app.db.session import get_db
from app.models.attendance import Attendance
from app.models.member import Member
from app.models.academy import Academy
from app.models.shift_assignment import ShiftAssignment
from app.models.age_range import AgeRange

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _parse_ubicaciones(ubicacion_raw: str | None) -> list[str]:
    if not ubicacion_raw:
        return []
    try:
        parsed = json.loads(ubicacion_raw)
        if isinstance(parsed, list):
            return parsed
        return [str(parsed)]
    except (json.JSONDecodeError, TypeError):
        return [str(ubicacion_raw)] if ubicacion_raw else []


def _get_attendee_name(row) -> tuple[str, str, str]:
    if row.Attendance.tipo == "academy":
        nombre = row.academy_nombre or "Academia"
        dni = row.academy_nombre or ""
        return nombre, "", dni
    nombre = row.member_nombre or ""
    apellido = row.member_apellidos or ""
    dni = row.member_dni or ""
    return f"{nombre} {apellido}".strip(), dni, ""


@router.get("/stats")
def stats(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    today = datetime.now(timezone.utc).date()
    now = datetime.now(timezone.utc)
    hace_una_hora = now - timedelta(hours=1)
    config = pool_config_crud.get_singleton(db)

    base = db.query(Attendance).filter(Attendance.liberado.is_(None))

    asistencias_hoy = base.filter(func.date(Attendance.fecha) == today).count()
    asistencias_semana = base.filter(Attendance.hora_entrada >= now - timedelta(days=7)).count()
    asistencias_mes = base.filter(Attendance.hora_entrada >= now - timedelta(days=30)).count()
    miembros_activos = db.query(Member).filter(Member.is_active).count()
    total_academias = db.query(Academy).count()

    ubicaciones_raw = config.ubicaciones
    try:
        ubicaciones_cfg = json.loads(ubicaciones_raw) if ubicaciones_raw else []
    except (json.JSONDecodeError, TypeError):
        ubicaciones_cfg = []

    limite = now - timedelta(hours=1)
    ocupados = (
        db.query(
            Attendance.ubicacion, Attendance.id, Attendance.member_id,
            Attendance.academy_id, Attendance.hora_entrada, Attendance.tipo,
            Member.nombre.label("member_nombre"),
            Member.apellidos.label("member_apellidos"),
            Member.dni.label("member_dni"),
            Academy.nombre.label("academy_nombre"),
        )
        .outerjoin(Member, Attendance.member_id == Member.id)
        .outerjoin(Academy, Attendance.academy_id == Academy.id)
        .filter(
            func.date(Attendance.fecha) == today,
            Attendance.hora_entrada >= limite,
            Attendance.ubicacion.isnot(None),
            Attendance.liberado.is_(None),
        )
        .all()
    )

    ocupados_map: dict[str, list] = {}
    for u in ocupados:
        ubicaciones = _parse_ubicaciones(u.ubicacion)
        if u.tipo == "academy":
            nombre = u.academy_nombre or "Academia"
            dni = u.academy_nombre or ""
        else:
            nombre = f"{u.member_nombre or ''} {u.member_apellidos or ''}".strip()
            dni = u.member_dni or ""

        for ub in ubicaciones:
            if ub not in ocupados_map:
                ocupados_map[ub] = []
            ocupados_map[ub].append({
                "attendance_id": str(u.id),
                "member_id": str(u.member_id) if u.member_id else None,
                "academy_id": str(u.academy_id) if u.academy_id else None,
                "nombre": nombre,
                "dni": dni,
                "hora_entrada": u.hora_entrada.isoformat(),
                "tipo": u.tipo,
            })

    ubicaciones_list = []
    for u in ubicaciones_cfg:
        nombre = u.get("nombre", "")
        miembros = ocupados_map.get(nombre, [])
        ubicaciones_list.append({
            "nombre": nombre,
            "tipo": u.get("tipo", "carril"),
            "ocupado": len(miembros) > 0,
            "miembros": miembros,
        })

    return {
        "asistencias_hoy": asistencias_hoy,
        "asistencias_semana": asistencias_semana,
        "asistencias_mes": asistencias_mes,
        "miembros_activos": miembros_activos,
        "total_academias": total_academias,
        "ubicaciones": ubicaciones_list,
    }


@router.get("/today-attendees")
def today_attendees(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    today = datetime.now(timezone.utc).date()

    rows = (
        db.query(
            Attendance.id, Attendance.member_id, Attendance.academy_id,
            Attendance.tipo, Attendance.hora_entrada, Attendance.ubicacion,
            Attendance.liberado,
            Member.nombre.label("member_nombre"),
            Member.apellidos.label("member_apellidos"),
            Member.dni.label("member_dni"),
            Academy.nombre.label("academy_nombre"),
        )
        .outerjoin(Member, Attendance.member_id == Member.id)
        .outerjoin(Academy, Attendance.academy_id == Academy.id)
        .filter(func.date(Attendance.fecha) == today)
        .order_by(Attendance.hora_entrada.desc())
        .all()
    )

    result = []
    for r in rows:
        if r.tipo == "academy":
            nombre = r.academy_nombre or "Academia"
            dni = r.academy_nombre or ""
        else:
            nombre = f"{r.member_nombre or ''} {r.member_apellidos or ''}".strip()
            dni = r.member_dni or ""
        ubicaciones = _parse_ubicaciones(r.ubicacion)
        result.append({
            "id": str(r.id),
            "member_id": str(r.member_id) if r.member_id else None,
            "academy_id": str(r.academy_id) if r.academy_id else None,
            "tipo": r.tipo,
            "nombre": nombre,
            "dni": dni,
            "hora_entrada": r.hora_entrada.isoformat(),
            "ubicaciones": ubicaciones,
        })
    return result


@router.get("/cronograma-semanal")
def cronograma_semanal(
    semana_inicio: date | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    hoy = datetime.now(timezone.utc).date()
    if not semana_inicio:
        semana_inicio = hoy - timedelta(days=hoy.weekday())

    semana_fin = semana_inicio + timedelta(days=6)

    assignments = (
        db.query(ShiftAssignment)
        .filter(
            ShiftAssignment.fecha_inicio <= semana_fin,
            ShiftAssignment.fecha_fin >= semana_inicio,
        )
        .all()
    )

    slots = []
    for h in range(5, 22):
        hora_str = f"{h:02d}:00"
        slots.append({
            "hora": hora_str,
            "lunes": [], "martes": [], "miercoles": [],
            "jueves": [], "viernes": [], "sabado": [], "domingo": [],
        })

    dias_map = {0: "lunes", 1: "martes", 2: "miercoles", 3: "jueves", 4: "viernes", 5: "sabado", 6: "domingo"}

    for a in assignments:
        cur = max(a.fecha_inicio, semana_inicio)
        end = min(a.fecha_fin, semana_fin)
        while cur <= end:
            if cur.weekday() == a.dia_semana:
                if a.hora_inicio and a.hora_fin:
                    h_ini = a.hora_inicio.hour
                    h_fin = a.hora_fin.hour
                elif a.horario:
                    h_ini = a.horario.hora_inicio.hour
                    h_fin = a.horario.hora_fin.hour
                else:
                    h_ini = 0
                    h_fin = 0

                for slot in slots:
                    h_slot = int(slot["hora"].split(":")[0])
                    if h_ini <= h_slot < h_fin:
                        nombre = ""
                        edad = None
                        apellidos = ""
                        mostrar = ""
                        if a.member:
                            nombre = a.member.nombre
                            apellidos = a.member.apellidos or ""
                            mostrar = f"{nombre} {apellidos}".strip()
                            if a.member.rango_edad_id:
                                ar = db.query(AgeRange).filter(AgeRange.id == a.member.rango_edad_id).first()
                                if ar:
                                    edad = {"id": str(ar.id), "nombre": ar.nombre, "color": ar.color}
                        elif a.academy:
                            nombre = a.academy.nombre
                            mostrar = f"{nombre} (Academia)"
                            edad = {"id": "", "nombre": "Academia", "color": a.academy.color}

                        dia_key = dias_map[cur.weekday()]
                        slot[dia_key].append({
                            "nombre": nombre,
                            "apellidos": apellidos,
                            "mostrar": mostrar,
                            "tipo": a.tipo,
                            "assignment_id": str(a.id),
                            "edad": edad,
                        })
            cur += timedelta(days=1)

    return {
        "semana_inicio": semana_inicio.isoformat(),
        "semana_fin": semana_fin.isoformat(),
        "slots": slots,
    }


@router.post("/liberar/{attendance_id}")
def liberar_ubicacion(
    attendance_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Asistencia no encontrada")
    attendance.liberado = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "ubicacion": attendance.ubicacion}
