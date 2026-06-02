from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_current_admin
from app.Models.user import User
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    UserAdminUpdate,
    UserCreate,
)
from app.Services.user_service import UserService

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    user_service = UserService(db)
    return [UserResponse.model_validate(u) for u in user_service.get_all()]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    user_service = UserService(db)
    return UserResponse.model_validate(user_service.get_by_id(user_id))


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    data: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    user_service = UserService(db)
    return UserResponse.model_validate(user_service.admin_update(user_id, data))


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    user_service = UserService(db)
    user_service.delete(user_id)
    return {"detail": "User deleted successfully"}


@router.put("/me/profile", response_model=UserResponse)
def update_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_service = UserService(db)
    return UserResponse.model_validate(user_service.update_profile(current_user, data))


@router.post("/me/delete-request", response_model=UserResponse)
def request_delete(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_service = UserService(db)
    return UserResponse.model_validate(user_service.request_delete(current_user))


@router.post("/{user_id}/approve-delete")
def approve_delete(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    user_service = UserService(db)
    user_service.approve_delete(user_id)
    return {"detail": "Account deleted"}


@router.post("/{user_id}/reject-delete", response_model=UserResponse)
def reject_delete(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    user_service = UserService(db)
    return UserResponse.model_validate(user_service.reject_delete(user_id))
