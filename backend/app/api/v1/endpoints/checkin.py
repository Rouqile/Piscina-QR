import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.schemas.checkin import CheckinEntry, CheckinInfo, CheckinResponse
from app.services.attendance_service import get_checkin_info, register_entry

router = APIRouter(prefix="/checkin", tags=["checkin"])


@router.get("/{identifier}", response_model=CheckinInfo)
def checkin_info(
    identifier: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    info = get_checkin_info(db, identifier)
    if not info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Miembro o academia no encontrado",
        )
    return info


@router.post("/{identifier}", response_model=CheckinResponse)
def checkin_entry(
    identifier: str,
    body: CheckinEntry = CheckinEntry(),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    info = get_checkin_info(db, identifier)
    if not info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Miembro o academia no encontrado",
        )

    if info.get("inactivo"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Miembro inactivo. No se permite el ingreso.",
        )

    ubicacion_json = None
    if body.ubicaciones:
        ubicacion_json = json.dumps(body.ubicaciones)

    attendance = register_entry(
        db,
        member_id=info.get("member_id"),
        academy_id=info.get("academy_id"),
        registrado_por=str(current_user.id),
        observacion=body.observacion or None,
        ubicacion=ubicacion_json,
    )
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo registrar la entrada",
        )

    return CheckinResponse(
        tipo=info.get("tipo", "member"),
        attendance_id=attendance.id,
        member_id=attendance.member_id,
        academy_id=attendance.academy_id,
        nombre=info["nombre"],
        hora_entrada=attendance.hora_entrada.isoformat(),
        ubicaciones=body.ubicaciones or [],
        aforo_actual=0,
        capacidad_maxima=0,
    )
