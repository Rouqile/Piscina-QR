from app.crud.base import CRUDBase
from app.models.categoria import Categoria
from app.schemas.categoria import CategoriaCreate, CategoriaUpdate


class CRUDCategoria(CRUDBase[Categoria, CategoriaCreate, CategoriaUpdate]):
    pass


categoria_crud = CRUDCategoria(Categoria)
