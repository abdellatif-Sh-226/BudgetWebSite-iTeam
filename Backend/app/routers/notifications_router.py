from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.Models.user import User
from app.schemas.notification import MarkReadRequest, NotificationsResponse, MarkReadResponse
from app.Services.notification_service import NotificationService

router = APIRouter(tags=["Notifications"])


@router.get("/api/notifications", response_model=NotificationsResponse)
def get_notifications(
    all: str = Query("0", alias="all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(db)
    return NotificationsResponse(**service.get_for_user(current_user.id, include_read=(all == "1")))


@router.post("/api/notifications", response_model=MarkReadResponse)
def mark_notification_read(
    data: MarkReadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(db)
    service.mark_read(current_user.id, data.id)
    return MarkReadResponse()
