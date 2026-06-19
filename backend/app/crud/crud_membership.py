from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.membership import Membership
from app.schemas.membership import MembershipCreate, MembershipUpdate


class CRUDMembership(CRUDBase[Membership, MembershipCreate, MembershipUpdate]):
    def get_by_member(self, db: Session, member_id: str):
        return (
            db.query(Membership)
            .filter(Membership.member_id == member_id)
            .all()
        )

    def get_active_by_member(self, db: Session, member_id: str):
        from sqlalchemy import func

        today = func.current_date()
        return (
            db.query(Membership)
            .filter(
                Membership.member_id == member_id,
                Membership.fecha_inicio <= today,
                Membership.fecha_fin >= today,
                Membership.estado_pago == "pagado",
            )
            .first()
        )


membership_crud = CRUDMembership(Membership)
