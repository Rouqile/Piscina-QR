from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.crud.crud_member import member_crud
from app.db.session import get_db
from app.schemas.member import MemberCreate, MemberResponse, MemberUpdate
from app.services.qr_service import generate_qr

router = APIRouter(prefix="/members", tags=["members"])


@router.get("/", response_model=list[MemberResponse])
def list_members(
    query: str = "",
    skip: int = 0,
    limit: int = 5000,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    if query:
        return member_crud.search(db, query, skip, limit)
    return member_crud.get_all(db, skip, limit)


@router.post("/", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def create_member(
    body: MemberCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    existing = member_crud.get_by_dni(db, body.dni)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un miembro con ese DNI",
        )
    create_data = body.model_dump()
    if create_data.get("rango_edad_id"):
        from app.models.age_range import AgeRange
        ar = db.query(AgeRange).filter(AgeRange.id == create_data["rango_edad_id"]).first()
        if not ar:
            raise HTTPException(status_code=400, detail="Rango de edad no encontrado")
    if not create_data.get("rango_edad_id"):
        create_data["rango_edad_id"] = None
    from app.models.member import Member as MemberModel
    db_obj = MemberModel(**create_data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@router.get("/{dni}", response_model=MemberResponse)
def get_member(
    dni: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    member = member_crud.get_by_dni(db, dni)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Miembro no encontrado"
        )
    return member


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: str,
    body: MemberUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    member = member_crud.get(db, member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Miembro no encontrado"
        )
    update_data = body.model_dump(exclude_unset=True)
    if "rango_edad_id" in update_data and update_data["rango_edad_id"]:
        from app.models.age_range import AgeRange
        ar = db.query(AgeRange).filter(AgeRange.id == update_data["rango_edad_id"]).first()
        if not ar:
            raise HTTPException(status_code=400, detail="Rango de edad no encontrado")
    if "rango_edad_id" in update_data and not update_data["rango_edad_id"]:
        update_data["rango_edad_id"] = None
    for field, value in update_data.items():
        setattr(member, field, value)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(
    member_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    member = member_crud.get(db, member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Miembro no encontrado"
        )

    from app.models.attendance import Attendance
    from app.models.membership import Membership
    from app.models.schedule_slot import ScheduleSlot
    from app.models.shift_assignment import ShiftAssignment

    db.query(Attendance).filter(Attendance.member_id == member_id).delete()
    db.query(ShiftAssignment).filter(ShiftAssignment.member_id == member_id).delete()
    for membership in db.query(Membership).filter(Membership.member_id == member_id).all():
        db.query(ScheduleSlot).filter(ScheduleSlot.membership_id == membership.id).delete()
    db.query(Membership).filter(Membership.member_id == member_id).delete()
    db.delete(member)
    db.commit()


@router.get("/{dni}/qr")
def get_member_qr(
    dni: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    member = member_crud.get_by_dni(db, dni)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Miembro no encontrado"
        )
    from fastapi.responses import Response

    buf = generate_qr(member.dni, member.codigo_unico)
    return Response(content=buf.getvalue(), media_type="image/png")
