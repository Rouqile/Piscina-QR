from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate


class CRUDAttendance(CRUDBase[Attendance, AttendanceCreate, AttendanceUpdate]):
    def get_today_entries(self, db: Session) -> int:
        today = datetime.now(timezone.utc).date()
        return (
            db.query(Attendance)
            .filter(func.date(Attendance.fecha) == today)
            .count()
        )

    def get_week_entries(self, db: Session) -> int:
        from datetime import timedelta

        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        return (
            db.query(Attendance)
            .filter(Attendance.fecha >= week_ago)
            .count()
        )

    def get_month_entries(self, db: Session) -> int:
        from datetime import timedelta

        month_ago = datetime.now(timezone.utc) - timedelta(days=30)
        return (
            db.query(Attendance)
            .filter(Attendance.fecha >= month_ago)
            .count()
        )

    def get_current_count(self, db: Session) -> int:
        today = datetime.now(timezone.utc).date()
        return (
            db.query(Attendance)
            .filter(func.date(Attendance.fecha) == today)
            .count()
        )

    def get_by_member(self, db: Session, member_id: str, skip=0, limit=50):
        return (
            db.query(Attendance)
            .filter(Attendance.member_id == member_id)
            .order_by(Attendance.fecha.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def has_entry_today(self, db: Session, member_id: str) -> bool:
        today = datetime.now(timezone.utc).date()
        return (
            db.query(Attendance)
            .filter(
                Attendance.member_id == member_id,
                func.date(Attendance.fecha) == today,
            )
            .first()
            is not None
        )

    def get_today_list(self, db: Session, skip=0, limit=100):
        today = datetime.now(timezone.utc).date()
        return (
            db.query(Attendance)
            .filter(func.date(Attendance.fecha) == today)
            .order_by(Attendance.hora_entrada.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )


attendance_crud = CRUDAttendance(Attendance)
