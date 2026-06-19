from datetime import date, timedelta, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.crud.crud_member import member_crud
from app.crud.crud_shift_assignment import shift_assignment_crud
from app.db.session import get_db
from app.models.shift_assignment import ShiftAssignment
from app.schemas.shift_assignment import (
    CalendarioEvento,
    ShiftAssignmentCreate,
    ShiftAssignmentResponse,
    ShiftAssignmentUpdate,
    ShiftBatchCreate,
)

router = APIRouter(prefix="/shift-assignments", tags=["shift-assignments"])


@router.get("/", response_model=list[ShiftAssignmentResponse])
def list_assignments(
    member_id: str = "",
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    if member_id:
        return shift_assignment_crud.get_by_member(db, member_id)
    return shift_assignment_crud.get_all(db)


@router.post(
    "/", response_model=ShiftAssignmentResponse, status_code=status.HTTP_201_CREATED
)
def create_assignment(
    body: ShiftAssignmentCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return shift_assignment_crud.create(db, body)


@router.post(
    "/batch",
    response_model=list[ShiftAssignmentResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_assignments_batch(
    body: ShiftBatchCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    created = []
    cur = body.fecha_inicio
    while cur <= body.fecha_fin:
        if cur.weekday() in body.dias_semana:
            obj = ShiftAssignment(
                member_id=body.member_id,
                academy_id=body.academy_id,
                tipo=body.tipo,
                horario_id=body.horario_id,
                hora_inicio=body.hora_inicio,
                hora_fin=body.hora_fin,
                dia_semana=cur.weekday(),
                fecha_inicio=cur,
                fecha_fin=cur,
            )
            db.add(obj)
            created.append(obj)
        cur += timedelta(days=1)
    db.commit()
    for obj in created:
        db.refresh(obj)
    return created


@router.put("/{assignment_id}", response_model=ShiftAssignmentResponse)
def update_assignment(
    assignment_id: str,
    body: ShiftAssignmentUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    obj = shift_assignment_crud.get(db, assignment_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignacion no encontrada",
        )
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    obj = shift_assignment_crud.get(db, assignment_id)
    if obj:
        shift_assignment_crud.remove(db, assignment_id)


@router.get("/calendario", response_model=list[CalendarioEvento])
def calendario(
    member_ids: str = Query(""),
    academy_ids: str = Query(""),
    tipo: str = Query(""),
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(ShiftAssignment).filter(
        ShiftAssignment.fecha_inicio <= fecha_fin,
        ShiftAssignment.fecha_fin >= fecha_inicio,
    )

    member_id_list = [m.strip() for m in member_ids.split(",") if m.strip()]
    academy_id_list = [a.strip() for a in academy_ids.split(",") if a.strip()]

    if tipo == "member":
        if member_id_list:
            query = query.filter(ShiftAssignment.member_id.in_(member_id_list))
        else:
            return []
    elif tipo == "academy":
        if academy_id_list:
            query = query.filter(ShiftAssignment.academy_id.in_(academy_id_list))
        else:
            return []
    else:
        filters = []
        if member_id_list:
            filters.append(ShiftAssignment.member_id.in_(member_id_list))
        if academy_id_list:
            filters.append(ShiftAssignment.academy_id.in_(academy_id_list))
        if not filters:
            return []
        query = query.filter(or_(*filters))

    assignments = query.all()
    events = []

    for a in assignments:
        cur = max(a.fecha_inicio, fecha_inicio)
        end = min(a.fecha_fin, fecha_fin)
        while cur <= end:
            if cur.weekday() == a.dia_semana:
                nombre = ""
                if a.member:
                    nombre = f"{a.member.nombre} {a.member.apellidos or ''}".strip()
                elif a.academy:
                    nombre = a.academy.nombre

                if a.hora_inicio and a.hora_fin:
                    h_ini = a.hora_inicio.strftime("%H:%M")
                    h_fin = a.hora_fin.strftime("%H:%M")
                    h_nombre = f"{h_ini} - {h_fin}"
                elif a.horario:
                    h_ini = a.horario.hora_inicio.strftime("%H:%M")
                    h_fin = a.horario.hora_fin.strftime("%H:%M")
                    h_nombre = a.horario.nombre
                else:
                    h_ini = "--:--"
                    h_fin = "--:--"
                    h_nombre = "Sin horario"

                events.append(
                    CalendarioEvento(
                        tipo=a.tipo,
                        dia_semana=a.dia_semana,
                        fecha=cur,
                        hora_inicio=h_ini,
                        hora_fin=h_fin,
                        member_id=a.member_id,
                        academy_id=a.academy_id,
                        member_nombre=nombre,
                        horario_nombre=h_nombre,
                        horario_id=a.horario_id,
                        assignment_id=a.id,
                    )
                )
            cur += timedelta(days=1)
    return events
