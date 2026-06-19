from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.auth import LoginRequest


class CRUDUser(CRUDBase[User, LoginRequest, LoginRequest]):
    def get_by_username(self, db: Session, username: str) -> User | None:
        return db.query(User).filter(User.username == username).first()

    def get_by_email(self, db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email).first()

    def get_by_id(self, db: Session, user_id: str) -> User | None:
        return db.query(User).filter(User.id == user_id).first()

    def create_admin(
        self, db: Session, username: str, email: str, password: str, nombre: str
    ) -> User:
        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(password),
            nombre=nombre,
            rol="admin",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


user_crud = CRUDUser(User)

get_user_by_id = user_crud.get_by_id
