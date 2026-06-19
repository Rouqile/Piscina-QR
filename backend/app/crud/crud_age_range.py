from app.crud.base import CRUDBase
from app.models.age_range import AgeRange
from app.schemas.age_range import AgeRangeCreate, AgeRangeUpdate


class CRUDAgeRange(CRUDBase[AgeRange, AgeRangeCreate, AgeRangeUpdate]):
    pass


age_range_crud = CRUDAgeRange(AgeRange)
