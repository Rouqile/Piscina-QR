from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.crud.crud_academy import academy_crud
from app.db.session import get_db
from app.schemas.academy import AcademyCreate, AcademyResponse, AcademyUpdate
from app.services.qr_service import generate_qr

router = APIRouter(prefix="/academies", tags=["academies"])


@router.get("/", response_model=list[AcademyResponse])
def list_academies(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return academy_crud.get_all(db)


@router.post("/", response_model=AcademyResponse, status_code=status.HTTP_201_CREATED)
def create_academy(
    body: AcademyCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return academy_crud.create(db, body)


@router.get("/{academy_id}", response_model=AcademyResponse)
def get_academy(
    academy_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    academy = academy_crud.get(db, academy_id)
    if not academy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Academia no encontrada"
        )
    return academy


@router.put("/{academy_id}", response_model=AcademyResponse)
def update_academy(
    academy_id: str,
    body: AcademyUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    academy = academy_crud.get(db, academy_id)
    if not academy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Academia no encontrada"
        )
    return academy_crud.update(db, academy, body)


@router.get("/{academy_id}/qr")
def get_academy_qr(
    academy_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    academy = academy_crud.get(db, academy_id)
    if not academy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Academia no encontrada"
        )
    buf = generate_qr(academy.codigo)
    return Response(content=buf.getvalue(), media_type="image/png")


@router.delete("/{academy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_academy(
    academy_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    academy = academy_crud.get(db, academy_id)
    if not academy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Academia no encontrada"
        )
    academy_crud.remove(db, academy_id)
