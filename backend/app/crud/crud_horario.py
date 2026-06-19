from app.crud.base import CRUDBase
from app.models.horario import Horario
from app.schemas.horario import HorarioCreate


class CRUDHorario(CRUDBase[Horario, HorarioCreate, HorarioCreate]):
    pass


horario_crud = CRUDHorario(Horario)
