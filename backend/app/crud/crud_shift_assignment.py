from datetime import date

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.shift_assignment import ShiftAssignment
from app.schemas.shift_assignment import ShiftAssignmentCreate, ShiftAssignmentCreate


class CRUDShiftAssignment(
    CRUDBase[ShiftAssignment, ShiftAssignmentCreate, ShiftAssignmentCreate]
):
    def get_by_member(self, db: Session, member_id: str):
        return (
            db.query(ShiftAssignment)
            .filter(ShiftAssignment.member_id == member_id)
            .all()
        )

    def get_by_member_and_day(
        self, db: Session, member_id: str, dia_semana: int, hoy: date
    ):
        return (
            db.query(ShiftAssignment)
            .filter(
                ShiftAssignment.member_id == member_id,
                ShiftAssignment.dia_semana == dia_semana,
                ShiftAssignment.fecha_inicio <= hoy,
                ShiftAssignment.fecha_fin >= hoy,
            )
            .all()
        )

    def get_calendario(
        self,
        db: Session,
        member_ids: list[str],
        fecha_inicio: date,
        fecha_fin: date,
    ):
        return (
            db.query(ShiftAssignment)
            .filter(
                ShiftAssignment.member_id.in_(member_ids),
                ShiftAssignment.fecha_inicio <= fecha_fin,
                ShiftAssignment.fecha_fin >= fecha_inicio,
            )
            .all()
        )


shift_assignment_crud = CRUDShiftAssignment(ShiftAssignment)
