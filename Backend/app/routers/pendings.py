from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.Models.user import User
from app.schemas.pending import CreatePendingRequest, PendingResponse
from app.Services.pending_service import PendingService

router = APIRouter(tags=["Pending"])


@router.get("/api/pending", response_model=list[dict])
def list_pending(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PendingService(db)
    return service.get_visible(current_user.id)


@router.post("/api/pending", response_model=PendingResponse)
def create_pending(
    data: CreatePendingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PendingService(db)
    return PendingResponse(**service.create_pending(data.model_dump(), current_user))
