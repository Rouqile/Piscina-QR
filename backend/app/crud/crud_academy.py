from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.academy import Academy
from app.schemas.academy import AcademyCreate, AcademyUpdate


class CRUDAcademy(CRUDBase[Academy, AcademyCreate, AcademyUpdate]):
    def get_by_codigo(self, db: Session, codigo: str) -> Academy | None:
        return db.query(Academy).filter(Academy.codigo == codigo).first()


academy_crud = CRUDAcademy(Academy)
