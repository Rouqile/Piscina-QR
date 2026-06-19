from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.crud.crud_horario import horario_crud
from app.db.session import get_db
from app.schemas.horario import HorarioCreate, HorarioResponse

router = APIRouter(prefix="/horarios", tags=["horarios"])


@router.get("/", response_model=list[HorarioResponse])
def list_horarios(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return horario_crud.get_all(db)


@router.post(
    "/", response_model=HorarioResponse, status_code=status.HTTP_201_CREATED
)
def create_horario(
    body: HorarioCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return horario_crud.create(db, body)


@router.delete("/{horario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_horario(
    horario_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    horario = horario_crud.get(db, horario_id)
    if horario:
        horario_crud.remove(db, horario_id)
