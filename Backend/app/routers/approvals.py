from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.Models.user import User
from app.schemas.pending import ApproveRequest, ApproveResponse
from app.Services.pending_service import PendingService

router = APIRouter(tags=["Approvals"])


@router.post("/api/approve", response_model=ApproveResponse)
def approve_pending(
    data: ApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PendingService(db)
    return ApproveResponse(**service.approve(data.id, data.action, current_user))
