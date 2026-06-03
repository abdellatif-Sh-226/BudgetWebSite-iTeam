from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.Models.user import User
from app.schemas.user import LoginRequest, LoginResponse, UserResponse, UserCreate
from app.Services.auth_service import AuthService
from app.Services.user_service import UserService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user_service = UserService(db)
    user = user_service.authenticate(request.email, request.password)
    token = AuthService.create_token(user.id, user.role)
    return LoginResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


def _login_response(user: User) -> dict:
    token = AuthService.create_token(user.id, user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "pwd": "",
            "role": user.role,
            "active": user.active if user.active is not None else True,
            "deleteRequest": user.delete_request if user.delete_request is not None else False,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
            "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
        },
    }


@router.post("/login-legacy")
def login_legacy(request: LoginRequest, db: Session = Depends(get_db)):
    user_service = UserService(db)
    user = user_service.authenticate(request.email, request.password)
    return _login_response(user)


@router.post("/register-legacy")
def register_legacy(
    data: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    data.role = "user"
    user_service = UserService(db)
    user = user_service.create(data, background_tasks)
    return _login_response(user)


@router.post("/logout")
def logout():
    return {"success": True}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/register", response_model=LoginResponse)
def register(
    data: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    data.role = "user"
    user_service = UserService(db)
    user = user_service.create(data, background_tasks)
    token = AuthService.create_token(user.id, user.role)
    return LoginResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )
