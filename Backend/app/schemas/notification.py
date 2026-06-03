from typing import Optional
from pydantic import BaseModel


class MarkReadRequest(BaseModel):
    id: str


class NotificationsResponse(BaseModel):
    notifications: list[dict] = []
    unreadCount: int = 0


class MarkReadResponse(BaseModel):
    success: bool = True
