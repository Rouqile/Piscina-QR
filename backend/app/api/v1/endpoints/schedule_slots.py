from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.crud.crud_schedule_slot import schedule_slot_crud
from app.db.session import get_db
from app.models.schedule_slot import ScheduleSlot
from app.schemas.schedule_slot import (
    ScheduleSlotBatchCreate,
    ScheduleSlotCreate,
    ScheduleSlotResponse,
)

router = APIRouter(prefix="/schedule-slots", tags=["schedule-slots"])


@router.get("/", response_model=list[ScheduleSlotResponse])
def list_slots(
    membership_id: str = "",
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    if membership_id:
        return schedule_slot_crud.get_by_membership(db, membership_id)
    return schedule_slot_crud.get_all(db)


@router.post(
    "/", response_model=ScheduleSlotResponse, status_code=status.HTTP_201_CREATED
)
def create_slot(
    body: ScheduleSlotCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return schedule_slot_crud.create(db, body)


@router.post(
    "/batch",
    response_model=list[ScheduleSlotResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_slots_batch(
    body: ScheduleSlotBatchCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    created = []
    for slot in body.slots:
        obj = ScheduleSlot(
            membership_id=slot.membership_id,
            dia_semana=slot.dia_semana,
            hora_inicio=slot.hora_inicio,
            hora_fin=slot.hora_fin,
        )
        db.add(obj)
        created.append(obj)
    db.commit()
    for obj in created:
        db.refresh(obj)
    return created


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_slot(
    slot_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    slot = schedule_slot_crud.get(db, slot_id)
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Slot no encontrado"
        )
    schedule_slot_crud.remove(db, slot_id)
