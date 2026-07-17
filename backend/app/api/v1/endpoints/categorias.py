from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.crud.crud_categoria import categoria_crud
from app.db.session import get_db
from app.schemas.categoria import CategoriaCreate, CategoriaResponse, CategoriaUpdate

router = APIRouter(prefix="/age-ranges", tags=["age-ranges"])


@router.get("/", response_model=list[CategoriaResponse])
def list_categorias(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return categoria_crud.get_all(db)


@router.post("/", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
def create_categoria(
    body: CategoriaCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return categoria_crud.create(db, body)


@router.put("/{categoria_id}", response_model=CategoriaResponse)
def update_categoria(
    categoria_id: str,
    body: CategoriaUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    cat = categoria_crud.get(db, categoria_id)
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Categoria no encontrada"
        )
    return categoria_crud.update(db, cat, body)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_categoria(
    categoria_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    cat = categoria_crud.get(db, categoria_id)
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Categoria no encontrada"
        )
    categoria_crud.remove(db, categoria_id)
