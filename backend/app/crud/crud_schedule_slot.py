from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.schedule_slot import ScheduleSlot
from app.schemas.schedule_slot import ScheduleSlotCreate, ScheduleSlotCreate


class CRUDScheduleSlot(
    CRUDBase[ScheduleSlot, ScheduleSlotCreate, ScheduleSlotCreate]
):
    def get_by_membership(self, db: Session, membership_id: str):
        return (
            db.query(ScheduleSlot)
            .filter(ScheduleSlot.membership_id == membership_id)
            .all()
        )

    def get_by_member_and_day(
        self, db: Session, member_id: str, dia_semana: int
    ):
        from app.models.membership import Membership

        return (
            db.query(ScheduleSlot)
            .join(Membership)
            .filter(
                Membership.member_id == member_id,
                ScheduleSlot.dia_semana == dia_semana,
                Membership.estado_pago == "pagado",
            )
            .all()
        )


schedule_slot_crud = CRUDScheduleSlot(ScheduleSlot)
