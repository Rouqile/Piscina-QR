from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.crud.crud_age_range import age_range_crud
from app.db.session import get_db
from app.schemas.age_range import AgeRangeCreate, AgeRangeResponse, AgeRangeUpdate

router = APIRouter(prefix="/age-ranges", tags=["age-ranges"])


@router.get("/", response_model=list[AgeRangeResponse])
def list_age_ranges(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return age_range_crud.get_all(db)


@router.post("/", response_model=AgeRangeResponse, status_code=status.HTTP_201_CREATED)
def create_age_range(
    body: AgeRangeCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return age_range_crud.create(db, body)


@router.put("/{age_range_id}", response_model=AgeRangeResponse)
def update_age_range(
    age_range_id: str,
    body: AgeRangeUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    ar = age_range_crud.get(db, age_range_id)
    if not ar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Rango de edad no encontrado"
        )
    return age_range_crud.update(db, ar, body)


@router.delete("/{age_range_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_age_range(
    age_range_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    ar = age_range_crud.get(db, age_range_id)
    if not ar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Rango de edad no encontrado"
        )
    age_range_crud.remove(db, age_range_id)
