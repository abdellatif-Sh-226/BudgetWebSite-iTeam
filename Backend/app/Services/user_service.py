from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session

from app.Models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserAdminUpdate
from app.Services.auth_service import AuthService
from app.Services.email_service import email_service
from app.Services.activity_service import ActivityService


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str) -> User:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def get_all(self) -> list[User]:
        return self.db.query(User).order_by(User.created_at.desc()).all()

    def create(self, data: UserCreate, background_tasks: BackgroundTasks) -> User:
        existing = self.get_by_email(data.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        if len(data.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

        user = User(
            name=data.name,
            email=data.email,
            password=AuthService.hash_password(data.password),
            role=data.role,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        ActivityService.log(self.db, user.id, "user.created", "User", user.id, f"User '{user.name}' created")
        email_service.send_welcome_email(user.email, user.name, background_tasks)

        return user

    def update_profile(self, user: User, data: UserUpdate) -> User:
        if data.name:
            user.name = data.name
        if data.email and data.email != user.email:
            existing = self.get_by_email(data.email)
            if existing:
                raise HTTPException(status_code=400, detail="Email already in use")
            user.email = data.email
        if data.current_password and data.new_password:
            if not AuthService.verify_password(data.current_password, user.password):
                raise HTTPException(status_code=400, detail="Current password is incorrect")
            if len(data.new_password) < 6:
                raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
            user.password = AuthService.hash_password(data.new_password)

        self.db.commit()
        self.db.refresh(user)
        ActivityService.log(self.db, user.id, "user.updated", "User", user.id, "Profile updated")
        return user

    def admin_update(self, user_id: str, data: UserAdminUpdate) -> User:
        user = self.get_by_id(user_id)
        if data.name is not None:
            user.name = data.name
        if data.email is not None:
            existing = self.get_by_email(data.email)
            if existing and existing.id != user_id:
                raise HTTPException(status_code=400, detail="Email already in use")
            user.email = data.email
        if data.role is not None:
            if data.role not in ("admin", "user"):
                raise HTTPException(status_code=400, detail="Invalid role")
            user.role = data.role
        if data.active is not None:
            user.active = data.active
            if not user.active:
                user.delete_request = False

        self.db.commit()
        self.db.refresh(user)
        ActivityService.log(self.db, user_id, "user.admin_updated", "User", user_id, f"Admin update: {data.model_dump(exclude_none=True)}")
        return user

    def delete(self, user_id: str) -> None:
        user = self.get_by_id(user_id)
        self.db.delete(user)
        self.db.commit()
        ActivityService.log(self.db, user_id, "user.deleted", "User", user_id, "User deleted")

    def request_delete(self, user: User) -> User:
        user.delete_request = True
        self.db.commit()
        self.db.refresh(user)
        ActivityService.log(self.db, user.id, "user.delete_requested", "User", user.id, "Delete account requested")
        return user

    def approve_delete(self, user_id: str) -> None:
        self.delete(user_id)

    def reject_delete(self, user_id: str) -> User:
        user = self.get_by_id(user_id)
        user.delete_request = False
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate(self, email: str, password: str) -> User:
        user = self.get_by_email(email)
        if not user or not AuthService.verify_password(password, user.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        if not user.active:
            raise HTTPException(status_code=403, detail="Account is disabled")
        return user
