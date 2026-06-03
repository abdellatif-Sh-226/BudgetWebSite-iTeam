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
