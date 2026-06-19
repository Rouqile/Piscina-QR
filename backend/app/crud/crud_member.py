from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.member import Member
from app.schemas.member import MemberCreate, MemberUpdate


class CRUDMember(CRUDBase[Member, MemberCreate, MemberUpdate]):
    def get_by_dni(self, db: Session, dni: str) -> Member | None:
        return (
            db.query(Member)
            .filter(
                or_(
                    Member.dni == dni,
                    Member.dni + Member.codigo_unico == dni,
                ),
                Member.is_active,
            )
            .first()
        )

    def search(self, db: Session, query: str, skip: int = 0, limit: int = 100):
        return (
            db.query(Member)
            .filter(
                (Member.nombre.ilike(f"%{query}%"))
                | (Member.apellidos.ilike(f"%{query}%"))
                | (Member.dni.ilike(f"%{query}%")),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all(self, db: Session, skip: int = 0, limit: int = 100):
        return (
            db.query(Member)
            .order_by(Member.is_active.desc(), Member.nombre)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_active_count(self, db: Session) -> int:
        return db.query(Member).filter(Member.is_active).count()


member_crud = CRUDMember(Member)
