import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.core.security import hash_password
from app.crud.crud_user import user_crud
from app.db.session import get_db
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def _serialize_user(user) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "nombre": user.nombre,
        "rol": user.rol,
        "is_active": user.is_active,
        "permisos": json.loads(user.permisos) if user.permisos else None,
        "created_at": user.created_at,
    }


@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    users = user_crud.get_all(db)
    return [_serialize_user(u) for u in users]


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    existing = user_crud.get_by_username(db, body.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya existe",
        )
    existing_email = user_crud.get_by_email(db, body.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya esta registrado",
        )
    user = user_crud.create_admin(
        db,
        username=body.username,
        email=body.email,
        password=body.password,
        nombre=body.nombre,
    )
    from app.models.user import User

    update_fields = {"rol": body.rol}
    if body.permisos is not None:
        update_fields["permisos"] = json.dumps(body.permisos)
    db.query(User).filter(User.id == user.id).update(update_fields)
    db.commit()
    db.refresh(user)
    return _serialize_user(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    body: UserUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    user = user_crud.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    update_data = body.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    if "permisos" in update_data:
        if update_data["permisos"] is not None:
            update_data["permisos"] = json.dumps(update_data["permisos"])
        else:
            update_data["permisos"] = None
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return _serialize_user(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    user = user_crud.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    user_crud.remove(db, user_id)
