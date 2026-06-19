from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.crud.crud_membership import membership_crud
from app.db.session import get_db
from app.schemas.membership import (
    MembershipCreate,
    MembershipResponse,
    MembershipUpdate,
)

router = APIRouter(prefix="/memberships", tags=["memberships"])


@router.get("/", response_model=list[MembershipResponse])
def list_memberships(
    member_id: str = "",
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    if member_id:
        return membership_crud.get_by_member(db, member_id)
    return membership_crud.get_all(db)


@router.post(
    "/", response_model=MembershipResponse, status_code=status.HTTP_201_CREATED
)
def create_membership(
    body: MembershipCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return membership_crud.create(db, body)


@router.put("/{membership_id}", response_model=MembershipResponse)
def update_membership(
    membership_id: str,
    body: MembershipUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    membership = membership_crud.get(db, membership_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membresía no encontrada",
        )
    return membership_crud.update(db, membership, body)


@router.delete("/{membership_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_membership(
    membership_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    membership = membership_crud.get(db, membership_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membresía no encontrada",
        )
    membership_crud.remove(db, membership_id)
